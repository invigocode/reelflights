"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { EnrichedFlightResult } from "@/lib/flights/types";
import { formatPrice, formatDateRange } from "@/lib/format";
import { isSafeExternalUrl } from "@/lib/validateExternalUrl";

interface FlightDetailDialogProps {
  flight: EnrichedFlightResult | null;
  originCity: string;
  onClose: () => void;
}

export function FlightDetailDialog({ flight, originCity, onClose }: FlightDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (flight && !dialog.open) {
      dialog.showModal();
    } else if (!flight && dialog.open) {
      dialog.close();
    }
  }, [flight]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={onClose}
      className="m-auto w-[min(560px,92vw)] max-h-[85vh] overflow-auto border border-line bg-surface p-0 backdrop:bg-ink/50"
      aria-labelledby="flight-detail-heading"
    >
      {flight && (
        <div>
          <div className="relative aspect-[16/9]">
            <Image src={flight.imageUrl} alt={flight.imageAlt} fill sizes="560px" className="object-cover" />
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <h2 id="flight-detail-heading" className="font-display text-3xl">
                {originCity} → {flight.destination.city}
              </h2>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                aria-label="Close"
                className="shrink-0 min-w-11 min-h-11 text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-rust"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 font-display text-4xl text-rust">{formatPrice(flight.price.amount, flight.price.currency)}</p>
            <p className="text-ink-muted">per person, return</p>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-6 text-sm">
              <div>
                <dt className="text-ink-muted">Dates</dt>
                <dd className="mt-0.5">{formatDateRange(flight.departure.date, flight.return?.date)}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Flight</dt>
                <dd className="mt-0.5">{flight.direct ? "Direct" : `${flight.stops} stop`}</dd>
              </div>
              {flight.airline && (
                <div>
                  <dt className="text-ink-muted">Airline</dt>
                  <dd className="mt-0.5">{flight.airline}</dd>
                </div>
              )}
              {flight.duration && (
                <div>
                  <dt className="text-ink-muted">Duration</dt>
                  <dd className="mt-0.5">{flight.duration}</dd>
                </div>
              )}
            </dl>

            {isSafeExternalUrl(flight.bookingUrl) ? (
              <a
                href={flight.bookingUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-8 inline-flex min-h-11 items-center gap-2 border border-ink px-6 py-3 text-lg hover:bg-ink hover:text-paper transition-colors motion-reduce:transition-none"
              >
                View flight <span aria-hidden>→</span>
              </a>
            ) : (
              <p className="mt-8 text-ink-muted">Booking link unavailable for this flight.</p>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
