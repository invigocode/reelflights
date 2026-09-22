import type { FlightResult, FlightSearchParams } from "./types";

export interface FlightProvider {
  /** Search for return flights from an origin across a month, one result per destination. */
  searchFlights(params: FlightSearchParams, destinationAirportCodes: string[]): Promise<FlightResult[]>;

  /** Fetch a single, more detailed result for one destination. */
  getFlightDetails(params: FlightSearchParams, destinationAirportCode: string): Promise<FlightResult | null>;

  /** Cheap liveness check used by the circuit breaker to decide when to retry a failing provider. */
  healthCheck(): Promise<boolean>;
}
