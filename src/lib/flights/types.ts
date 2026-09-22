import { z } from "zod";

// Internal normalized flight schema. Provider responses (mock or real) are
// always validated against this before touching the rest of the app — raw
// provider payloads never reach the frontend.
export const flightResultSchema = z.object({
  destination: z.object({
    city: z.string(),
    country: z.string(),
    airportCode: z.string().length(3),
    countryCode: z.string().length(2).optional(),
  }),
  price: z.object({
    amount: z.number().positive(),
    currency: z.string().length(3),
  }),
  departure: z.object({
    date: z.string(),
    time: z.string().optional(),
  }),
  return: z
    .object({
      date: z.string(),
      time: z.string().optional(),
    })
    .optional(),
  airline: z.string().optional(),
  stops: z.number().int().min(0),
  duration: z.string().optional(),
  bookingUrl: z.string().url().optional(),
  direct: z.boolean(),
  availability: z.string().optional(),
  source: z.string().optional(),
  fetchedAt: z.string(),
});

export type FlightResult = z.infer<typeof flightResultSchema>;

export const flightSearchParamsSchema = z.object({
  origin: z.string().length(3).regex(/^[A-Z]{3}$/, "origin must be a 3-letter IATA code"),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month must be formatted YYYY-MM"),
});

export type FlightSearchParams = z.infer<typeof flightSearchParamsSchema>;

// FlightResult plus the destination metadata the API route attaches before
// returning results to the client.
export type EnrichedFlightResult = FlightResult & {
  destinationSlug: string;
  imageUrl: string;
  imageAlt: string;
};
