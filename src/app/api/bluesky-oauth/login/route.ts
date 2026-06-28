/**
 * GET /api/bluesky-oauth/login?handle=xxx
 *
 * Initiates the AT Protocol OAuth authorization flow for the given Bluesky handle.
 *
 * Requirements:
 *   - The caller must have an active Signal session (NextAuth). Returns 401 otherwise.
 *   - ?handle=<bluesky handle or DID> is required. Returns 400 otherwise.
 *
 * Flow:
 *   1. Verify Signal session via auth() from @/lib/auth
 *   2. Call client.authorize(handle) — retried up to 3× on transient socket errors
 *   3. Redirect the browser to that URL
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBlueskyOAuthClient } from "@/lib/bluesky-oauth";

export const runtime = "nodejs";

/** Returns true for transient network errors worth retrying (e.g. GOAWAY, UND_ERR_SOCKET). */
function isTransientError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message + (err.cause instanceof Error ? " " + err.cause.message : "");
  return (
    msg.includes("GOAWAY") ||
    msg.includes("UND_ERR_SOCKET") ||
    msg.includes("fetch failed") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ETIMEDOUT")
  );
}

async function authorizeWithRetry(handle: string, maxAttempts = 3): Promise<URL> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const client = await getBlueskyOAuthClient();
      return await client.authorize(handle);
    } catch (err) {
      lastErr = err;
      const isTransient = isTransientError(err);
      console.warn(
        `[bluesky-oauth] /login authorize attempt ${attempt}/${maxAttempts} failed${
          isTransient ? " (transient)" : ""
        }:`,
        err instanceof Error ? err.message : err
      );
      if (!isTransient || attempt === maxAttempts) break;
      // Exponential back-off: 300ms, 900ms
      await new Promise(r => setTimeout(r, 300 * attempt));
    }
  }
  throw lastErr;
}

export async function GET(request: NextRequest) {
  // 1. Require a Signal session
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed into Signal to connect a Bluesky account." },
      { status: 401 }
    );
  }

  // 2. Require ?handle=
  const handle = request.nextUrl.searchParams.get("handle")?.trim();
  if (!handle) {
    return NextResponse.json(
      { error: "Missing required query parameter: handle" },
      { status: 400 }
    );
  }

  try {
    // authorize() resolves the handle to a DID, discovers the user's PDS,
    // creates a PAR request, stores state in DynamoDB, and returns the
    // authorization URL to redirect the user to.
    const authUrl = await authorizeWithRetry(handle);

    // 3. Redirect browser to Bluesky authorization server
    return NextResponse.redirect(authUrl.toString());
  } catch (err) {
    console.error("[bluesky-oauth] /login error (all retries exhausted):", err);
    const detail = err instanceof Error ? err.message : String(err);
    // Redirect to /connect with an error message instead of a raw 500 JSON
    return NextResponse.redirect(
      new URL(
        `/connect?error=login_failed&desc=${encodeURIComponent(detail)}`,
        request.url
      )
    );
  }
}
