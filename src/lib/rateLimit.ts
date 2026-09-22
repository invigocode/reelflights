// Simple fixed-window rate limiter, scoped to a single server instance.
// Sufficient for the MVP's traffic level; a distributed store (e.g. Redis)
// would be needed once running across many concurrent instances (see
// DESIGN.md "Known limitations").

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();
const WINDOW_MS = 60_000;

// Periodically drop stale windows so this doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, w] of windows) {
    if (now >= w.resetAt) windows.delete(key);
  }
}, WINDOW_MS).unref?.();

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string, limitPerMinute: number): RateLimitResult {
  const now = Date.now();
  let window = windows.get(key);

  if (!window || now >= window.resetAt) {
    window = { count: 0, resetAt: now + WINDOW_MS };
    windows.set(key, window);
  }

  window.count += 1;

  return {
    allowed: window.count <= limitPerMinute,
    limit: limitPerMinute,
    remaining: Math.max(0, limitPerMinute - window.count),
    resetAt: window.resetAt,
  };
}
