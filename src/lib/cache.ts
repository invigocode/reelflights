// In-memory TTL cache with stale-while-revalidate and single-flight request
// coalescing. Scoped to a single server process/lambda instance — this is
// deliberately simple for the MVP (see DESIGN.md/README "Known limitations").
// A distributed store (e.g. Redis) would be the next step if traffic
// outgrows a single instance's cache hit rate.

interface CacheEntry<T> {
  value: T;
  expiresAt: number; // hard expiry — value is discarded after this
  staleAt: number; // soft expiry — value is served but revalidated in background after this
}

const store = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

interface GetOrFetchOptions {
  ttlMs: number;
  staleWhileRevalidateMs?: number;
}

export async function getOrFetch<T>(key: string, fetcher: () => Promise<T>, options: GetOrFetchOptions): Promise<T> {
  const now = Date.now();
  const entry = store.get(key) as CacheEntry<T> | undefined;

  if (entry && now < entry.expiresAt) {
    if (now >= entry.staleAt && !inFlight.has(key)) {
      // Serve stale value immediately, refresh in the background.
      void revalidate(key, fetcher, options);
    }
    return entry.value;
  }

  // No usable cached value — coalesce concurrent identical requests into one.
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = fetcher()
    .then((value) => {
      set(key, value, options);
      return value;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

async function revalidate<T>(key: string, fetcher: () => Promise<T>, options: GetOrFetchOptions) {
  const promise = fetcher()
    .then((value) => {
      set(key, value, options);
      return value;
    })
    .catch(() => {
      // Revalidation failures keep serving the last good (now-expired-soon)
      // value until the hard TTL forces a synchronous refetch.
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

function set<T>(key: string, value: T, options: GetOrFetchOptions) {
  const now = Date.now();
  const staleAt = now + options.ttlMs;
  store.set(key, {
    value,
    staleAt,
    expiresAt: staleAt + (options.staleWhileRevalidateMs ?? 0),
  });
}
