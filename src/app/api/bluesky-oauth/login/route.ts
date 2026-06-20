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
 *   2. Call client.authorize(handle) to get the Bluesky authorization URL
 *   3. Redirect the browser to that URL
 *
 * client.authorize() verified from oauth-client.d.ts:
 *   authorize(input: string, options?: AuthorizeOptions): Promise<URL>
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBlueskyOAuthClient } from "@/lib/bluesky-oauth";

export const runtime = "nodejs";

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
    const client = await getBlueskyOAuthClient();

    // authorize() resolves the handle to a DID, discovers the user's PDS,
    // creates a PAR request, stores state in DynamoDB, and returns the
    // authorization URL to redirect the user to.
    const authUrl = await client.authorize(handle);

    // 3. Redirect browser to Bluesky authorization server
    return NextResponse.redirect(authUrl.toString());
  } catch (err) {
    console.error("[bluesky-oauth] /login error:", err);
    return NextResponse.json(
      {
        error:
          "Failed to initiate Bluesky authorization. Check that the handle is valid.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
