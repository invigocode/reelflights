import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What ReelFlights collects, why, and for how long.",
};

export default function PrivacyPage() {
  return (
    <main id="main" className="flex-1 px-6 sm:px-10 py-16 sm:py-24 max-w-2xl mx-auto">
      <h1 className="font-display text-4xl">Privacy</h1>
      <p className="mt-6 text-ink-muted">Last updated: 22 September 2026.</p>

      <div className="mt-10 space-y-8">
        <section>
          <h2 className="font-display text-xl">What we collect</h2>
          <p className="mt-2 text-ink-muted">
            ReelFlights does not require an account and does not collect names, email addresses, phone numbers, or
            location data. Your flight searches (departure airport and month) are sent to our server to look up
            prices, but we don&apos;t attach them to an identity.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">Technical logs</h2>
          <p className="mt-2 text-ink-muted">
            Like most web services, our server temporarily processes your IP address to apply rate limiting and
            prevent abuse of the search API. These technical logs are kept only as long as needed for that purpose
            and are not used for tracking, profiling, or advertising.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">Cookies</h2>
          <p className="mt-2 text-ink-muted">
            ReelFlights does not set advertising or tracking cookies. No consent banner is shown because no
            non-essential cookies are used.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">Third parties</h2>
          <p className="mt-2 text-ink-muted">
            When you click &ldquo;View flight,&rdquo; you leave ReelFlights for an external booking site. That
            site&apos;s own privacy policy applies once you arrive there.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">Contact</h2>
          <p className="mt-2 text-ink-muted">
            Questions about this policy can be sent to the site operator via the contact details published on this
            domain.
          </p>
        </section>
      </div>
    </main>
  );
}
