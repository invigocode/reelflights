import { getAirports } from "@/lib/airports";
import { SearchExperience } from "@/components/SearchExperience";

// Render at request time rather than build time: this page queries Postgres
// for the airport list, and the database isn't guaranteed to be reachable
// during the build step (e.g. before it's provisioned on a fresh deploy).
export const dynamic = "force-dynamic";

export default async function Home() {
  const airports = await getAirports();

  return (
    <>
      <header className="px-6 sm:px-10 pt-8">
        <p className="font-display text-xl tracking-tight">ReelFlights</p>
      </header>

      <main id="main" className="flex-1 px-6 sm:px-10 pt-16 sm:pt-24 pb-24 max-w-[1400px] w-full mx-auto">
        <h1 className="font-display font-medium text-hero leading-[var(--text-hero--line-height)] tracking-[var(--text-hero--letter-spacing)] max-w-4xl">
          Find your next trip.
        </h1>
        <p className="mt-6 max-w-lg text-lg text-ink-muted">
          Pick where you&apos;re flying from and when you&apos;re free. We&apos;ll show you where you can go, and what it costs.
        </p>

        <div className="mt-12">
          <SearchExperience airports={airports} defaultOrigin="MAN" />
        </div>
      </main>

      <footer className="px-6 sm:px-10 py-10 border-t border-line text-sm text-ink-muted flex flex-wrap gap-x-6 gap-y-2">
        <p>© {new Date().getFullYear()} ReelFlights</p>
        <a href="/privacy" className="hover:text-ink">Privacy</a>
      </footer>
    </>
  );
}
