"use client";

import { useMemo, useState } from "react";
import type { AirportOption } from "@/lib/airports";
import type { EnrichedFlightResult } from "@/lib/flights/types";
import { AirportCombobox } from "./AirportCombobox";
import { MonthSelect } from "./MonthSelect";
import { FlightResults } from "./FlightResults";
import { FlightDetailDialog } from "./FlightDetailDialog";

interface SearchExperienceProps {
  airports: AirportOption[];
  defaultOrigin: string;
}

export function SearchExperience({ airports, defaultOrigin }: SearchExperienceProps) {
  const [origin, setOrigin] = useState<string>(defaultOrigin);
  const [month, setMonth] = useState<string | null>(null);
  const [directOnly, setDirectOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"price" | "city">("price");
  const [selectedFlight, setSelectedFlight] = useState<EnrichedFlightResult | null>(null);

  const originCity = useMemo(() => airports.find((a) => a.iataCode === origin)?.city ?? origin, [airports, origin]);

  return (
    <div>
      <div className="max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <AirportCombobox airports={airports} value={origin} onChange={setOrigin} label="From" placeholder="Manchester (MAN)" />
        <MonthSelect value={month} onChange={setMonth} label="When" />
      </div>

      <div className="mt-16">
        {!month ? (
          <p className="text-ink-muted">Choose a month to see where you could go.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-end gap-6 mb-8 text-sm">
              <label className="flex items-center gap-2 min-h-11">
                <input
                  type="checkbox"
                  checked={directOnly}
                  onChange={(e) => setDirectOnly(e.target.checked)}
                  className="h-4 w-4 accent-rust"
                />
                Direct flights only
              </label>
              <label className="flex items-center gap-2 min-h-11">
                Sort by
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "price" | "city")}
                  className="border border-line bg-surface px-2 py-1.5"
                >
                  <option value="price">Price</option>
                  <option value="city">Destination</option>
                </select>
              </label>
            </div>

            <FlightResults
              key={`${origin}-${month}`}
              origin={origin}
              month={month}
              originCity={originCity}
              directOnly={directOnly}
              sortBy={sortBy}
              onSelectFlight={setSelectedFlight}
            />
          </>
        )}
      </div>

      <FlightDetailDialog flight={selectedFlight} originCity={originCity} onClose={() => setSelectedFlight(null)} />
    </div>
  );
}
