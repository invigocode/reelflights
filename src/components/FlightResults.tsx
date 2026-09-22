"use client";

import { useEffect, useMemo, useState } from "react";
import type { EnrichedFlightResult } from "@/lib/flights/types";
import { DestinationCard } from "./DestinationCard";

interface FlightResultsState {
  status: "loading" | "error" | "success";
  flights: EnrichedFlightResult[];
  errorMessage: string | null;
}

interface FlightResultsProps {
  origin: string;
  month: string;
  originCity: string;
  directOnly: boolean;
  sortBy: "price" | "city";
  onSelectFlight: (flight: EnrichedFlightResult) => void;
}

// Remounted via a `key={origin+month}` by the parent whenever the search
// changes, so the initial "loading" state comes from useState's initial
// value (computed at render time) rather than a setState call at the top
// of an effect.
export function FlightResults({ origin, month, originCity, directOnly, sortBy, onSelectFlight }: FlightResultsProps) {
  const [state, setState] = useState<FlightResultsState>({ status: "loading", flights: [], errorMessage: null });

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/flights?origin=${encodeURIComponent(origin)}&month=${encodeURIComponent(month)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Something went wrong.");
        return body.results as EnrichedFlightResult[];
      })
      .then((flights) => setState({ status: "success", flights, errorMessage: null }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setState({ status: "error", flights: [], errorMessage: message });
      });

    return () => controller.abort();
  }, [origin, month]);

  const visibleFlights = useMemo(() => {
    let list = state.flights;
    if (directOnly) list = list.filter((f) => f.direct);
    return [...list].sort((a, b) =>
      sortBy === "price" ? a.price.amount - b.price.amount : a.destination.city.localeCompare(b.destination.city),
    );
  }, [state.flights, directOnly, sortBy]);

  if (state.status === "loading") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10" aria-busy="true" aria-live="polite">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse motion-reduce:animate-none">
            <div className="aspect-[4/5] bg-line" />
            <div className="mt-3 h-7 w-20 bg-line" />
            <div className="mt-2 h-4 w-32 bg-line" />
          </div>
        ))}
        <span className="sr-only">Loading destinations…</span>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div role="alert" className="border border-line p-8 text-center">
        <p className="font-display text-2xl">We couldn&apos;t load flights right now.</p>
        <p className="mt-2 text-ink-muted">{state.errorMessage}</p>
      </div>
    );
  }

  if (visibleFlights.length === 0) {
    return (
      <div className="border border-line p-8 text-center">
        <p className="font-display text-2xl">No flights found for that search.</p>
        <p className="mt-2 text-ink-muted">Try a different month, or turn off the direct-only filter.</p>
      </div>
    );
  }

  return (
    <>
      <p className="text-ink-muted mb-8">{visibleFlights.length} destinations from {originCity}</p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-12">
        {visibleFlights.map((flight, index) => (
          <li key={flight.destination.airportCode}>
            <DestinationCard
              flight={flight}
              originCity={originCity}
              onSelect={() => onSelectFlight(flight)}
              priority={index === 0}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
