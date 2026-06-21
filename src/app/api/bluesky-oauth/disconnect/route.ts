/**
 * DELETE /api/bluesky-oauth/disconnect
 *
 * Removes the BLUESKY_LINK record for the authenticated Signal user from DynamoDB.
 * This only removes our local link; it does not revoke the token at Bluesky's server.
 *
 * Response: { success: true }
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteItem } from "@/lib/dynamo";

export const runtime = "nodejs";

export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "No user ID in session" }, { status: 400 });
  }

  await deleteItem(`USER#${userId}`, "BLUESKY_LINK");

  return NextResponse.json({ success: true });
}
