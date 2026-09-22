import { prisma } from "@/lib/db";
import { getOrFetch } from "@/lib/cache";

export interface AirportOption {
  iataCode: string;
  name: string;
  city: string;
  country: string;
}

export async function getAirports(): Promise<AirportOption[]> {
  return getOrFetch(
    "airports:all",
    async () => {
      const airports = await prisma.airport.findMany({
        orderBy: { city: "asc" },
        select: { iataCode: true, name: true, city: true, country: true },
      });
      return airports;
    },
    { ttlMs: 60 * 60_000 }, // airport data changes rarely — cache for an hour
  );
}
