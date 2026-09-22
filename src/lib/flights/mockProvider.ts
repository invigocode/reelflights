import type { FlightProvider } from "./provider";
import { flightResultSchema, type FlightResult, type FlightSearchParams } from "./types";

// Base return-fare guide prices (GBP) roughly reflecting real-world low-cost
// short-haul fares from Manchester. Mock data only — never used for real
// pricing decisions.
const BASE_PRICE_GBP: Record<string, number> = {
  BCN: 42, BUD: 39, LIS: 58, MXP: 47, PRG: 63, CDG: 45, AMS: 52, FCO: 55,
  ATH: 74, AGP: 44, ALC: 41, FAO: 49, DUB: 35, KRK: 38, WAW: 43, BER: 46,
  CPH: 68, VIE: 57, OPO: 46, TFS: 89,
};

const AIRLINES = ["Ryanair", "easyJet", "Jet2", "TUI Airways", "British Airways", "Wizz Air"];

// Deterministic pseudo-random generator so the same origin/destination/month
// always yields the same mock result (stable for caching + testing).
function seededRandom(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function daysInMonth(month: string): number {
  const [year, mon] = month.split("-").map(Number);
  return new Date(year, mon, 0).getDate();
}

function buildResult(origin: string, destinationCode: string, month: string): FlightResult | null {
  const basePrice = BASE_PRICE_GBP[destinationCode];
  if (!basePrice) return null;

  const rand = seededRandom(`${origin}-${destinationCode}-${month}`);
  const dim = daysInMonth(month);
  const startDay = 1 + Math.floor(rand() * (dim - 4));
  const tripLength = 3 + Math.floor(rand() * 4); // 3-6 nights
  const endDay = Math.min(startDay + tripLength, dim);
  const direct = rand() > 0.3;
  const priceVariance = 0.85 + rand() * 0.5;
  const amount = Math.round(basePrice * priceVariance);

  const pad = (n: number) => String(n).padStart(2, "0");
  const departureDate = `${month}-${pad(startDay)}`;
  const returnDate = `${month}-${pad(endDay)}`;

  return {
    destination: {
      city: "",
      country: "",
      airportCode: destinationCode,
    },
    price: { amount, currency: "GBP" },
    departure: { date: departureDate },
    return: { date: returnDate },
    airline: AIRLINES[Math.floor(rand() * AIRLINES.length)],
    stops: direct ? 0 : 1,
    duration: direct ? `${1 + Math.floor(rand() * 3)}h ${Math.floor(rand() * 60)}m` : undefined,
    bookingUrl: `https://www.skyscanner.net/transport/flights/${origin.toLowerCase()}/${destinationCode.toLowerCase()}/${departureDate.replace(/-/g, "")}/${returnDate.replace(/-/g, "")}/`,
    direct,
    availability: rand() > 0.85 ? "limited" : "available",
    source: "mock",
    fetchedAt: new Date().toISOString(),
  };
}

export class MockFlightProvider implements FlightProvider {
  async searchFlights(params: FlightSearchParams, destinationAirportCodes: string[]): Promise<FlightResult[]> {
    // Simulate realistic network latency so loading states are exercised in the UI.
    await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 200));

    const results: FlightResult[] = [];
    for (const code of destinationAirportCodes) {
      const raw = buildResult(params.origin, code, params.month);
      if (!raw) continue;
      const parsed = flightResultSchema.safeParse(raw);
      if (parsed.success) results.push(parsed.data);
    }
    return results;
  }

  async getFlightDetails(params: FlightSearchParams, destinationAirportCode: string): Promise<FlightResult | null> {
    await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 150));
    const raw = buildResult(params.origin, destinationAirportCode, params.month);
    if (!raw) return null;
    const parsed = flightResultSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
