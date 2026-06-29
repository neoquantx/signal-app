/**
 * GET /api/bluesky-oauth/callback
 *
 * Handles the redirect back from the Bluesky authorization server.
 *
 * Flow:
 *   1. Verify the Signal session
 *   2. Pass the full query string to client.callback() to exchange the code
 *   3. Resolve the real human-readable handle via app.bsky.actor.getProfile(did)
 *   4. Store PK=USER#{signalUserId} / SK=BLUESKY_LINK with { did, handle, linkedAt }
 *   5. Redirect to /connect
 *
 * Handle resolution:
 *   app.bsky.actor.getProfile({ actor: did }) returns ProfileViewDetailed which
 *   has a `handle` field — the canonical human-readable handle (e.g. "you.bsky.social").
 *   This is the correct way to go from DID → handle; the OAuth callback itself
 *   only gives us the DID.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBlueskyOAuthClient } from "@/lib/bluesky-oauth";
import { Agent } from "@atproto/api";
import { putItem } from "@/lib/dynamo";

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

/** Runs fn(), and if it throws a transient error retries once after a short delay. */
async function retryOnTransient<T>(fn: () => Promise<T>, label: string): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (!isTransientError(err)) throw err;
    console.warn(`[bluesky-oauth] ${label} transient error, retrying in 500ms:`, err instanceof Error ? err.message : err);
    await new Promise(r => setTimeout(r, 500));
    return await fn();
  }
}

export async function GET(request: NextRequest) {
  // 1. Require the Signal session so we know whose account to link
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(
      new URL("/login?error=session_expired", request.url)
    );
  }

  const signalUserId = (session.user as { id?: string }).id;
  if (!signalUserId) {
    return NextResponse.redirect(
      new URL("/login?error=no_user_id", request.url)
    );
  }

  // 2. Handle OAuth errors returned by the authorization server
  const errorParam = request.nextUrl.searchParams.get("error");
  if (errorParam) {
    const desc = request.nextUrl.searchParams.get("error_description") ?? "";
    console.error("[bluesky-oauth] callback error from AS:", errorParam, desc);
    return NextResponse.redirect(
      new URL(
        `/connect?error=${encodeURIComponent(errorParam)}&desc=${encodeURIComponent(desc)}`,
        request.url
      )
    );
  }

  try {
    const client = await getBlueskyOAuthClient();

    // 3. Exchange the authorization code for tokens (with retry on transient errors).
    //    callback() validates state, does token exchange, stores session in DynamoDB.
    const { session: oauthSession } = await retryOnTransient(
      () => client.callback(request.nextUrl.searchParams),
      "callback()"
    );

    const did = oauthSession.did;

    // 4. Resolve the real handle by calling app.bsky.actor.getProfile with the DID.
    //    We build a temporary Agent from the OAuthSession's fetchHandler.
    //    getProfile({ actor: did }) returns ProfileViewDetailed which has `handle`.
    let handle: string = did; // safe fallback to DID if resolution fails
    try {
      const agent = new Agent(oauthSession.fetchHandler.bind(oauthSession));
      const profileRes = await agent.getProfile({ actor: did });
      // profileRes.data.handle is the canonical Bluesky handle (e.g. "you.bsky.social")
      if (profileRes.data?.handle) {
        handle = profileRes.data.handle;
      }
    } catch (resolveErr) {
      // Non-fatal: we still proceed with storing the DID as handle fallback
      console.warn(
        "[bluesky-oauth] handle resolution failed, falling back to DID:",
        resolveErr
      );
    }

    // 5. Persist the Signal user → Bluesky DID + real handle mapping in DynamoDB
    await putItem({
      PK: `USER#${signalUserId}`,
      SK: "BLUESKY_LINK",
      did,
      handle,
      linkedAt: new Date().toISOString(),
    });

    // 6. Redirect to the connect page with success state
    return NextResponse.redirect(new URL("/connect?success=true", request.url));
  } catch (err) {
    console.error("[bluesky-oauth] callback exchange error:", err);
    return NextResponse.redirect(
      new URL(
        `/connect?error=callback_failed&desc=${encodeURIComponent(
          err instanceof Error ? err.message : String(err)
        )}`,
        request.url
      )
    );
  }
}
