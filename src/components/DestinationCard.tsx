import Image from "next/image";
import type { EnrichedFlightResult } from "@/lib/flights/types";
import { formatPrice, formatDateRange } from "@/lib/format";

interface DestinationCardProps {
  flight: EnrichedFlightResult;
  originCity: string;
  onSelect: () => void;
  priority?: boolean;
}

export function DestinationCard({ flight, originCity, onSelect, priority = false }: DestinationCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group text-left w-full focus-visible:outline-2 focus-visible:outline-rust focus-visible:outline-offset-4"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-line">
        <Image
          src={flight.imageUrl}
          alt={flight.imageAlt}
          fill
          priority={priority}
          sizes="(min-width: 1280px) 23vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 94vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink/70 to-transparent" aria-hidden />
        <p className="absolute left-4 bottom-3 font-display text-2xl text-paper">{flight.destination.city}</p>
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="font-display text-3xl text-rust">{formatPrice(flight.price.amount, flight.price.currency)}</span>
        <span className="text-sm text-ink-muted">return</span>
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        {originCity} → {flight.destination.city}
      </p>
      <p className="text-sm text-ink-muted">
        {formatDateRange(flight.departure.date, flight.return?.date)} · {flight.direct ? "Direct" : `${flight.stops} stop`}
      </p>
    </button>
  );
}
