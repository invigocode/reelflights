import { NextRequest, NextResponse } from "next/server";

// Per-request nonce so script-src can stay strict (no 'unsafe-inline')
// while still allowing Next.js's own hydration scripts to run. Next.js
// automatically applies this nonce to the scripts it injects once it sees
// the x-nonce request header alongside a CSP containing 'nonce-'.
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  // Next.js dev mode needs eval() for HMR/debugging — never allowed in production.
  const devEval = process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'";

  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${devEval};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data:;
    font-src 'self' data:;
    connect-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Skip static assets and the image optimizer — CSP only matters for
    // documents and API responses.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
