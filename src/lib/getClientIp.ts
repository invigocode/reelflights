import { env } from "@/lib/env";

/**
 * Resolves the originating client IP from X-Forwarded-For, honoring only
 * TRUSTED_PROXY_COUNT hops (e.g. Vercel's edge network). Never trusts the
 * full header blindly — a client can put arbitrary values in front of
 * their own real IP, so we only read the entry that our trusted proxy
 * chain is guaranteed to have appended.
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (!forwardedFor) return "unknown";

  const chain = forwardedFor.split(",").map((ip) => ip.trim());
  // The trusted proxy appends the real client IP as the Nth-from-the-end
  // entry, where N = TRUSTED_PROXY_COUNT. Anything the client injected
  // before that point is untrusted and ignored.
  const index = chain.length - env.TRUSTED_PROXY_COUNT;
  return chain[index] || chain[0] || "unknown";
}
