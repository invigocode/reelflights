import { fetchWithRetry } from "@/lib/http/fetchWithRetry";
import { CircuitBreaker } from "./circuitBreaker";
import type { FlightProvider } from "./provider";
import { flightResultSchema, type FlightResult, type FlightSearchParams } from "./types";

/**
 * Adapter for a real, commercial flight-data provider. NOT wired to a
 * specific vendor yet — before enabling FLIGHT_PROVIDER=real in production,
 * confirm the provider's commercial usage rights, data licensing, public
 * display rights, attribution requirements, rate limits, caching
 * restrictions, and deep-link/booking restrictions (see README).
 *
 * The reliability scaffolding here (timeouts, bounded retries, circuit
 * breaker, response validation against the normalized schema) is
 * provider-agnostic and stays the same regardless of which vendor is
 * plugged in below.
 */
export class RealFlightProvider implements FlightProvider {
  private breaker = new CircuitBreaker({ failureThreshold: 5, openDurationMs: 30_000 });

  constructor(
    private apiKey: string,
    private baseUrl: string,
  ) {}

  async searchFlights(params: FlightSearchParams, destinationAirportCodes: string[]): Promise<FlightResult[]> {
    if (!this.apiKey || !this.baseUrl) {
      throw new Error("Real flight provider is not configured. Set FLIGHT_API_KEY and FLIGHT_API_BASE_URL.");
    }
    if (!this.breaker.canRequest()) {
      throw new Error("Flight provider is temporarily unavailable.");
    }

    try {
      // TODO: replace with the vetted provider's actual search endpoint and
      // request shape once one has been selected (see class doc above).
      const response = await fetchWithRetry(
        `${this.baseUrl}/search?origin=${encodeURIComponent(params.origin)}&month=${encodeURIComponent(params.month)}&destinations=${destinationAirportCodes.join(",")}`,
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
          timeoutMs: 6000,
          maxRetries: 2,
        },
      );

      if (!response.ok) {
        this.breaker.recordFailure();
        throw new Error(`Flight provider responded with status ${response.status}`);
      }

      const body = await response.json();
      const results = this.normalizeAndValidate(body);
      this.breaker.recordSuccess();
      return results;
    } catch (err) {
      this.breaker.recordFailure();
      throw err;
    }
  }

  async getFlightDetails(params: FlightSearchParams, destinationAirportCode: string): Promise<FlightResult | null> {
    const results = await this.searchFlights(params, [destinationAirportCode]);
    return results[0] ?? null;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey || !this.baseUrl) return false;
    try {
      const response = await fetchWithRetry(`${this.baseUrl}/health`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeoutMs: 3000,
        maxRetries: 0,
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /** Never trust an external API response — validate every field before it enters the app. */
  private normalizeAndValidate(body: unknown): FlightResult[] {
    if (!Array.isArray(body)) return [];
    const results: FlightResult[] = [];
    for (const item of body) {
      const parsed = flightResultSchema.safeParse(item);
      if (parsed.success) results.push(parsed.data);
      // Malformed/incomplete provider entries are silently dropped rather
      // than surfaced — the frontend never sees raw provider shapes.
    }
    return results;
  }
}
