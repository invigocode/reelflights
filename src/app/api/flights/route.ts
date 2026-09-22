import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { getFlightProvider } from "@/lib/flights";
import { getOrFetch } from "@/lib/cache";
import { checkRateLimit } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/getClientIp";

export const runtime = "nodejs";

// Search results become stale-but-servable this long, then hard-expire
// after the additional stale-while-revalidate window. Chosen conservatively
// for the mock provider; a real provider's licensing terms must be checked
// before caching its data for this long (see README).
const CACHE_TTL_MS = 10 * 60_000;
const CACHE_SWR_MS = 5 * 60_000;

// Hard ceiling on destinations searched per request, independent of how
// many are active in the database — keeps a single request's cost bounded.
const MAX_DESTINATIONS_PER_SEARCH = 30;

const querySchema = z.object({
  origin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "origin must be a 3-letter IATA code"),
  month: z
    .string()
    .trim()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month must be formatted YYYY-MM"),
});

function isMonthWithinRange(month: string): boolean {
  const [year, mon] = month.split("-").map(Number);
  const requested = new Date(year, mon - 1, 1);
  const now = new Date();
  const earliest = new Date(now.getFullYear(), now.getMonth(), 1);
  const latest = new Date(now.getFullYear(), now.getMonth() + 12, 1);
  return requested >= earliest && requested <= latest;
}

function safeErrorResponse(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`flights:${clientIp}`, env.RATE_LIMIT_SEARCH_PER_MINUTE);

  if (!rateLimit.allowed) {
    return safeErrorResponse("Too many requests. Please slow down.", 429, {
      retryAfterSeconds: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
    });
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  // Reject unexpected parameters outright rather than silently ignoring them.
  const allowedKeys = new Set(["origin", "month"]);
  for (const key of Object.keys(searchParams)) {
    if (!allowedKeys.has(key)) {
      return safeErrorResponse(`Unexpected parameter: ${key}`, 400);
    }
  }

  const parsed = querySchema.safeParse(searchParams);
  if (!parsed.success) {
    return safeErrorResponse("Invalid search parameters.", 400, {
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { origin, month } = parsed.data;

  if (!isMonthWithinRange(month)) {
    return safeErrorResponse("Month must be within the next 12 months.", 400);
  }

  const originAirport = await prisma.airport.findUnique({ where: { iataCode: origin } });
  if (!originAirport) {
    return safeErrorResponse("Unknown departure airport.", 400);
  }

  try {
    const results = await getOrFetch(
      `flights:${origin}:${month}`,
      () => searchAndNormalize(origin, month),
      { ttlMs: CACHE_TTL_MS, staleWhileRevalidateMs: CACHE_SWR_MS },
    );

    return NextResponse.json(
      { origin, month, results },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    // Detailed provider/DB errors are never sent to the client.
    return safeErrorResponse("Flight search is temporarily unavailable. Please try again shortly.", 503);
  }
}

async function searchAndNormalize(origin: string, month: string) {
  const destinations = await prisma.destination.findMany({
    where: { active: true },
    take: MAX_DESTINATIONS_PER_SEARCH,
  });

  const destinationByCode = new Map(destinations.map((d) => [d.airportCode, d]));
  const provider = getFlightProvider();
  const flights = await provider.searchFlights({ origin, month }, [...destinationByCode.keys()]);

  const enriched = flights
    .map((flight) => {
      const meta = destinationByCode.get(flight.destination.airportCode);
      if (!meta) return null; // drop results we have no destination metadata for
      return {
        ...flight,
        destination: {
          city: meta.city,
          country: meta.country,
          airportCode: meta.airportCode,
          countryCode: meta.countryCode,
        },
        destinationSlug: meta.slug,
        imageUrl: meta.imageUrl,
        imageAlt: meta.imageAlt,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => a.price.amount - b.price.amount);

  return enriched;
}
