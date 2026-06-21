/**
 * GET /api/bluesky-oauth/my-feed
 *
 * Fetches the authenticated Signal user's real personal Bluesky timeline
 * (posts from accounts they follow) via their per-user OAuth session,
 * scored for authenticity using the same heuristic as the public Discover feed.
 *
 * Response shapes (all 200):
 *   { posts: [], connected: false }            — user hasn't linked Bluesky
 *   { posts: FeedPost[], connected: true }     — success
 *   { posts: [], connected: true, error: "…" } — agent error (expired session, network, etc.)
 *
 * Types verified from node_modules:
 *   getTimeline → OutputSchema.feed: AppBskyFeedDefs.FeedViewPost[]
 *   FeedViewPost.post: PostView
 *   PostView.author: ProfileViewBasic  { did, handle, displayName?, avatar? }
 *   PostView.record: { [key: string]: unknown }  — we cast to access `text` and `createdAt`
 *   PostView.{ likeCount?, repostCount?, replyCount?, cid, uri, indexedAt }
 *   FeedViewPost.reason?: $Typed<ReasonRepost> | $Typed<ReasonPin> | { $type: string }
 *   ReasonRepost.by: ProfileViewBasic
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserBlueskyAgent } from "@/lib/bluesky-oauth";
import { computeContentHeuristicScore } from "@/lib/bluesky";

export const runtime = "nodejs";

export interface MyFeedPost {
  id: string;
  authorName: string;
  authorHandle: string;
  authorImage: string;
  content: string;
  humanScore: number;
  likeCount: number;
  repostCount: number;
  replyCount: number;
  createdAt: string;
  externalUrl: string;
  isRepost: boolean;
  repostedBy?: string;
}

export async function GET() {
  // 1. Require Signal session
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signalUserId = (session.user as { id?: string }).id;
  if (!signalUserId) {
    return NextResponse.json({ error: "No user ID" }, { status: 400 });
  }

  // 2. Get the per-user OAuth agent
  const agent = await getUserBlueskyAgent(signalUserId);
  if (!agent) {
    // User hasn't connected Bluesky yet
    return NextResponse.json({ posts: [], connected: false });
  }

  try {
    // 3. Fetch the real following timeline (limit 25)
    const timelineRes = await agent.getTimeline({ limit: 25 });

    // timelineRes.data.feed is FeedViewPost[]
    const feedItems = timelineRes.data.feed ?? [];

    const posts: MyFeedPost[] = feedItems
      .map(item => {
        // item.post is PostView (verified from defs.d.ts)
        const post = item.post;

        // post.record is typed as { [key: string]: unknown } in PostView.
        // The actual Bluesky app.bsky.feed.post record always has `text` and `createdAt`.
        const record = post.record as { text?: string; createdAt?: string };
        const text = record.text ?? "";
        const createdAt = record.createdAt ?? post.indexedAt;

        // Detect repost: item.reason.$type === 'app.bsky.feed.defs#reasonRepost'
        const isRepost =
          item.reason?.$type === "app.bsky.feed.defs#reasonRepost";

        // ReasonRepost.by is ProfileViewBasic — displayName or handle
        let repostedBy: string | undefined;
        if (isRepost && item.reason) {
          const reasonRepost = item.reason as {
            by?: { handle?: string; displayName?: string };
          };
          repostedBy =
            reasonRepost.by?.displayName ||
            reasonRepost.by?.handle;
        }

        // Build a BlueskyPost-shaped object for computeContentHeuristicScore.
        // The function only needs { record: { text, createdAt }, likeCount, repostCount, replyCount }
        const scoreInput = {
          uri: post.uri,
          cid: post.cid,
          author: {
            did: post.author.did,
            handle: post.author.handle,
            displayName: post.author.displayName,
            avatar: post.author.avatar,
          },
          record: { text, createdAt },
          likeCount: post.likeCount,
          repostCount: post.repostCount,
          replyCount: post.replyCount,
          indexedAt: post.indexedAt,
        };

        const authorName =
          post.author.displayName || post.author.handle;
        const authorHandle = post.author.handle;
        const postSlug = post.uri.split("/").pop() ?? "";

        return {
          id: post.cid,
          authorName,
          authorHandle,
          authorImage: post.author.avatar ?? "",
          content: text,
          humanScore: computeContentHeuristicScore(scoreInput),
          likeCount: post.likeCount ?? 0,
          repostCount: post.repostCount ?? 0,
          replyCount: post.replyCount ?? 0,
          createdAt,
          externalUrl: `https://bsky.app/profile/${authorHandle}/post/${postSlug}`,
          isRepost,
          repostedBy,
        };
      })
      // Skip items with no text content (e.g. pure image/video posts or deleted posts)
      .filter(p => p.content.trim().length > 0);

    return NextResponse.json({ posts, connected: true });
  } catch (err) {
    // Return a graceful error — don't crash. The UI will show a retry prompt.
    console.error("[my-feed] agent.getTimeline error:", err);
    return NextResponse.json({
      posts: [],
      connected: true,
      error:
        err instanceof Error
          ? err.message
          : "Failed to load your Bluesky feed. Try reconnecting your account.",
    });
  }
}
