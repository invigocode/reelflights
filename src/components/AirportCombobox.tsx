"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { AirportOption } from "@/lib/airports";

interface AirportComboboxProps {
  airports: AirportOption[];
  value: string | null;
  onChange: (iataCode: string) => void;
  label: string;
  placeholder?: string;
}

function filterAirports(airports: AirportOption[], query: string): AirportOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return airports.slice(0, 8);

  return airports
    .filter(
      (a) =>
        a.iataCode.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q),
    )
    .sort((a, b) => {
      const aExact = a.iataCode.toLowerCase() === q ? 0 : 1;
      const bExact = b.iataCode.toLowerCase() === q ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      const aStarts = a.city.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = b.city.toLowerCase().startsWith(q) ? 0 : 1;
      return aStarts - bStarts;
    })
    .slice(0, 8);
}

export function AirportCombobox({ airports, value, onChange, label, placeholder }: AirportComboboxProps) {
  const selected = useMemo(() => airports.find((a) => a.iataCode === value) ?? null, [airports, value]);
  const [query, setQuery] = useState(selected ? `${selected.city} (${selected.iataCode})` : "");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 120);
    return () => clearTimeout(timer);
  }, [query]);

  const results = useMemo(() => filterAirports(airports, debouncedQuery), [airports, debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function select(airport: AirportOption) {
    onChange(airport.iataCode);
    setQuery(`${airport.city} (${airport.iataCode})`);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      if (activeIndex >= 0 && results[activeIndex]) {
        event.preventDefault();
        select(results[activeIndex]);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const inputId = useId();

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={inputId} className="block text-sm font-medium text-ink-muted mb-1.5">
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
        autoComplete="off"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full min-h-11 border border-line bg-surface px-4 py-3 text-lg text-ink placeholder:text-ink-muted/60 focus-visible:outline-2 focus-visible:outline-rust"
      />
      {open && results.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="absolute z-20 mt-1 w-full max-h-72 overflow-auto border border-line bg-surface shadow-[0_8px_24px_rgba(28,26,21,0.08)]"
        >
          {results.map((airport, index) => (
            <li
              key={airport.iataCode}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={airport.iataCode === value}
              onMouseDown={(e) => {
                e.preventDefault();
                select(airport);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={`min-h-11 px-4 py-2.5 cursor-pointer flex items-baseline justify-between gap-3 ${
                index === activeIndex ? "bg-paper" : ""
              }`}
            >
              <span>
                {airport.city}
                <span className="text-ink-muted"> · {airport.name}</span>
              </span>
              <span className="text-ink-muted text-sm tabular-nums">{airport.iataCode}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
