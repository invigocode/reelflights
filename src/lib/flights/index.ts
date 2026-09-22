import { env } from "@/lib/env";
import { MockFlightProvider } from "./mockProvider";
import { RealFlightProvider } from "./realProvider";
import type { FlightProvider } from "./provider";

let provider: FlightProvider | undefined;

export function getFlightProvider(): FlightProvider {
  if (!provider) {
    provider =
      env.FLIGHT_PROVIDER === "real"
        ? new RealFlightProvider(env.FLIGHT_API_KEY, env.FLIGHT_API_BASE_URL)
        : new MockFlightProvider();
  }
  return provider;
}

export type { FlightProvider } from "./provider";
export type { FlightResult, FlightSearchParams } from "./types";
