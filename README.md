# ReelFlights

**Find your next trip.** A flight-discovery app: pick a departure airport and
a month, see where you could go and what it costs, click through to book
externally. See `DESIGN.md` for the visual system.

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS v4 · PostgreSQL ·
Prisma 7 (driver adapters) · Zod

## Local development

Requires **Node 22+** for the Prisma CLI (`prisma dev`, `prisma generate`,
`prisma db push`) — the Next.js app itself runs fine on Node 20+. If you're
on Node 20, run Prisma commands with a Node 22+ binary on your `PATH` for
just those commands.

```bash
npm install
cp .env.example .env          # fill in DATABASE_URL, or use `prisma dev` below for a local Postgres
npx prisma dev -d --name reelflights   # spins up a local Postgres (requires Node 22+); prints a DATABASE_URL — put it in .env
npm run db:push               # apply the schema
npm run db:seed               # seed airports + 20 destinations
npm run dev
```

Open http://localhost:3000.

## Environment variables

See `.env.example` for the full list. Nothing marked `NEXT_PUBLIC_*` — no
secret ever reaches the browser. Key ones:

- `DATABASE_URL` — Postgres connection string.
- `FLIGHT_PROVIDER` — `mock` (default) or `real`. The mock provider generates deterministic, realistic-looking fares with no external calls.
- `FLIGHT_API_KEY` / `FLIGHT_API_BASE_URL` — only used when `FLIGHT_PROVIDER=real`.
- `RATE_LIMIT_SEARCH_PER_MINUTE`, `RATE_LIMIT_AUTOCOMPLETE_PER_MINUTE` — per-IP request budgets.
- `TRUSTED_PROXY_COUNT` — number of trusted reverse-proxy hops in front of the app, used to resolve the real client IP from `X-Forwarded-For` correctly (set to `1` behind Vercel's edge).

## Architecture

```
Browser → ReelFlights (Next.js) → FlightProvider adapter → external flight API
```

The browser never talks to a flight provider directly and never receives
provider credentials. All external calls happen server-side, behind:

- **Provider abstraction** (`src/lib/flights/provider.ts`): `MockFlightProvider` (default) and a `RealFlightProvider` skeleton with timeouts, bounded retries with backoff, and a circuit breaker already wired up — only the actual vendor request/response mapping is a TODO.
- **Normalized schema** (`src/lib/flights/types.ts`, Zod): every provider response is validated against this before it can reach the frontend. Malformed entries are dropped, not surfaced.
- **Destination/airport data** lives in Postgres via Prisma (`prisma/schema.prisma`), separate from live flight pricing, which is never persisted.
- **`/api/flights`** (`src/app/api/flights/route.ts`): validates input with Zod, rejects unknown params, rate-limits by IP, coalesces concurrent identical requests, caches results (stale-while-revalidate), and returns safe, minimal error messages (no stack traces, no internal details).

### Known limitations (MVP scope)

- The in-memory cache and rate limiter are per-server-instance. Fine at MVP traffic; if this runs across many concurrent serverless instances under real load, move both to a shared store (e.g. Redis / Vercel KV).
- Destination photos are placeholders (`picsum.photos`) — see `DESIGN.md`.

## Before enabling a real flight provider

`FLIGHT_PROVIDER=real` and `RealFlightProvider` exist as scaffolding only.
Before pointing them at a real vendor (e.g. a RapidAPI flight-data product),
confirm:

- Commercial usage rights and data licensing
- Public display rights and any required attribution
- API terms, rate limits, and pricing
- Geographic coverage, accuracy, and reliability
- Deep-link/booking restrictions
- Caching restrictions (adjust `CACHE_TTL_MS` in `src/app/api/flights/route.ts` accordingly)
- Data retention restrictions

Do not scrape Google Flights or any site with bot protection/ToS
restrictions, and never represent a third-party data source as an official
Google Flights API.

## Security

- CSP (nonce-based, `strict-dynamic`), HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and a restrictive Permissions-Policy are set in `src/proxy.ts` (CSP, per-request nonce) and `next.config.ts` (static headers).
- All API input is validated with Zod; unexpected query parameters are rejected outright.
- Only `http(s)` URLs are ever rendered as outbound links (`src/lib/validateExternalUrl.ts`), and external booking links use `rel="noopener noreferrer nofollow"`.
- No raw SQL — all database access goes through Prisma.
- Client IP resolution honors `TRUSTED_PROXY_COUNT` rather than trusting `X-Forwarded-For` blindly.

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Provision a Postgres database (Vercel Postgres, Neon, Supabase, etc.) and set `DATABASE_URL` in the Vercel project's environment variables — plus the other variables from `.env.example`.
3. Run `npx prisma db push` and `npm run db:seed` once against the production database (or wire them into a deploy step).
4. Update `SITE_URL` in `src/lib/site.ts` to the real production domain (used by metadata, `robots.ts`, and `sitemap.ts`).
5. Set `TRUSTED_PROXY_COUNT=1` (Vercel sits in front of the app as one trusted hop).

## Note on design tooling used during development

This project was built with guidance from three external "anti-generic-AI-design"
tools (`skills` CLI + `taste-skill`, the `ponytail` Claude Code plugin, and
`impeccable`) at the project owner's explicit request. They influenced
design/implementation decisions during development; none of their code ships
in the production bundle.
