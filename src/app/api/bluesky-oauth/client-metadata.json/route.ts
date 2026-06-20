/**
 * GET /api/bluesky-oauth/client-metadata.json
 *
 * Serves the OAuth client metadata document required by the AT Protocol
 * for "discoverable" clients. The client_id URL must resolve to this endpoint.
 *
 * This is only meaningful in production (where PUBLIC_URL is set).
 * In local dev the loopback client_id ("http://localhost") is used instead
 * and no discovery is performed.
 */

import { NextResponse } from "next/server";
import { getBlueskyOAuthClient } from "@/lib/bluesky-oauth";

export const runtime = "nodejs"; // needs AWS SDK

export async function GET() {
  try {
    const client = await getBlueskyOAuthClient();
    // client.clientMetadata is the validated/normalised ClientMetadata object
    return NextResponse.json(client.clientMetadata, {
      headers: {
        // Required content-type per AT Protocol OAuth discovery spec
        "Content-Type": "application/json",
        // Allow Bluesky authorization servers to fetch this
        "Access-Control-Allow-Origin": "*",
        // Cache for 1 hour — metadata doesn't change often
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[bluesky-oauth] client-metadata error:", err);
    return NextResponse.json(
      { error: "Failed to load client metadata" },
      { status: 500 }
    );
  }
}
