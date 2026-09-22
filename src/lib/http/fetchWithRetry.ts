interface FetchWithRetryOptions extends RequestInit {
  timeoutMs?: number;
  maxRetries?: number;
}

function isRetryableStatus(status: number): boolean {
  // Retry on server errors and rate limiting; never on 4xx client errors
  // (bad input, auth failures) since retrying won't change the outcome.
  return status >= 500 || status === 429;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * fetch() with an explicit timeout (AbortController) and bounded,
 * jittered exponential backoff. Only retries on network errors, timeouts,
 * and retryable HTTP statuses (5xx / 429) — never on 4xx.
 */
export async function fetchWithRetry(url: string, options: FetchWithRetryOptions = {}): Promise<Response> {
  const { timeoutMs = 5000, maxRetries = 2, ...init } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);

      if (!response.ok && isRetryableStatus(response.status) && attempt < maxRetries) {
        const backoff = Math.min(1000 * 2 ** attempt, 4000) + Math.random() * 250;
        await sleep(backoff);
        continue;
      }
      return response;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      if (attempt >= maxRetries) break;
      const backoff = Math.min(1000 * 2 ** attempt, 4000) + Math.random() * 250;
      await sleep(backoff);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed");
}
