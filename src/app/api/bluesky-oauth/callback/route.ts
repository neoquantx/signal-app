/**
 * GET /api/bluesky-oauth/callback
 *
 * Handles the redirect back from the Bluesky authorization server after
 * the user approves (or denies) the OAuth request.
 *
 * Flow:
 *   1. Verify the Signal session (must still be active)
 *   2. Pass the full query string to client.callback() to exchange the code
 *   3. Store PK=USER#{signalUserId} / SK=BLUESKY_LINK with { did, handle }
 *   4. Redirect to /connect
 *
 * client.callback() verified from oauth-client.d.ts:
 *   callback(params: URLSearchParams, options?: CallbackOptions):
 *     Promise<{ session: OAuthSession; state: string | null }>
 *
 * OAuthSession.did: AtprotoDid (the user's Bluesky DID) — verified from oauth-session.d.ts
 *
 * ASSUMPTION: We resolve the handle by using the DID directly after the callback.
 *   The AT Protocol does not return the handle in the OAuth callback response.
 *   We do a best-effort handle resolution by reading it from the token set's sub,
 *   but in practice we store the DID and leave handle resolution for the UI layer.
 *   If a handle is needed immediately, a separate call to the identity API would
 *   be required — flagged as a future improvement.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBlueskyOAuthClient } from "@/lib/bluesky-oauth";
import { putItem } from "@/lib/dynamo";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // 1. Require the Signal session so we know whose account to link
  const session = await auth();
  if (!session?.user) {
    // The user's Signal session may have expired during the OAuth flow.
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

    // 3. Exchange the authorization code for tokens and restore the session.
    //    client.callback() validates the state parameter against DynamoDB,
    //    performs the token exchange, and stores the session in DynamoDB.
    const { session: oauthSession } = await client.callback(
      request.nextUrl.searchParams
    );

    // oauthSession.did is the user's Bluesky DID (AtprotoDid = `did:${string}:${string}`)
    const did = oauthSession.did;

    // 4. Persist the Signal user → Bluesky DID mapping in DynamoDB.
    //    ASSUMPTION: We store the raw DID as the "handle" field too until a
    //    richer identity resolution is wired in (the AT Protocol handle is not
    //    returned in the callback; you'd need a separate call to app.bsky.actor.getProfile).
    await putItem({
      PK: `USER#${signalUserId}`,
      SK: "BLUESKY_LINK",
      did,
      // Best-effort: store DID as handle placeholder. The UI should resolve
      // the human-readable handle separately via getUserBlueskyAgent().
      handle: did,
      linkedAt: new Date().toISOString(),
    });

    // 5. Redirect to the connect/success page
    return NextResponse.redirect(new URL("/connect", request.url));
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
