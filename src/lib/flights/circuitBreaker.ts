type CircuitState = "closed" | "open" | "half-open";

interface CircuitBreakerOptions {
  failureThreshold: number;
  openDurationMs: number;
}

/**
 * Minimal circuit breaker protecting the app from a failing flight provider.
 * closed -> (failureThreshold consecutive failures) -> open
 * open -> (openDurationMs elapsed) -> half-open -> (one trial call) -> closed | open
 */
export class CircuitBreaker {
  private state: CircuitState = "closed";
  private consecutiveFailures = 0;
  private openedAt = 0;

  constructor(private options: CircuitBreakerOptions) {}

  canRequest(): boolean {
    if (this.state === "closed") return true;
    if (this.state === "open") {
      if (Date.now() - this.openedAt >= this.options.openDurationMs) {
        this.state = "half-open";
        return true;
      }
      return false;
    }
    // half-open: allow exactly one trial call through at a time.
    return true;
  }

  recordSuccess() {
    this.consecutiveFailures = 0;
    this.state = "closed";
  }

  recordFailure() {
    this.consecutiveFailures += 1;
    if (this.state === "half-open" || this.consecutiveFailures >= this.options.failureThreshold) {
      this.state = "open";
      this.openedAt = Date.now();
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}
