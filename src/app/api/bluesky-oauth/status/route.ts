/**
 * GET /api/bluesky-oauth/status
 *
 * Returns the real Bluesky connection status for the authenticated Signal user
 * by reading PK `USER#{signalUserId}` / SK "BLUESKY_LINK" from DynamoDB.
 *
 * Response shape:
 *   { connected: false }
 *   { connected: true, handle: string, linkedAt: string }
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getItem } from "@/lib/dynamo";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "No user ID in session" }, { status: 400 });
  }

  const link = await getItem(`USER#${userId}`, "BLUESKY_LINK");

  if (!link?.did) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    handle: (link.handle as string | undefined) ?? (link.did as string),
    linkedAt: link.linkedAt as string | undefined,
  });
}
