/**
 * GET /api/bluesky-oauth/jwks.json
 *
 * Serves the PUBLIC JWKS (JSON Web Key Set) for this OAuth client.
 * The private "d" field is NEVER included — the client.jwks getter
 * on OAuthClient already returns only public keys (verified from types.d.ts:
 *   get jwks(): Readonly<{ keys: readonly (... & { d?: never })[] }>
 * so the { d?: never } constraint guarantees private fields are stripped).
 */

import { NextResponse } from "next/server";
import { getBlueskyOAuthClient } from "@/lib/bluesky-oauth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const client = await getBlueskyOAuthClient();

    // client.jwks is already the PUBLIC-only JWKS — types guarantee d?: never
    // on every key in the returned array.
    return NextResponse.json(client.jwks, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        // Cache for 1 hour (keys don't rotate frequently)
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[bluesky-oauth] jwks.json error:", err);
    return NextResponse.json(
      { error: "Failed to load JWKS" },
      { status: 500 }
    );
  }
}
