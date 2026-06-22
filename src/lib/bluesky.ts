interface BlueskyAuthor {
  did: string
  handle: string
  displayName?: string
  avatar?: string
}

interface BlueskyPost {
  uri: string
  cid: string
  author: BlueskyAuthor
  record: { text: string; createdAt: string }
  likeCount?: number
  repostCount?: number
  replyCount?: number
  indexedAt: string
}

export interface DiscoverPost {
  id: string
  source: "bluesky"
  authorName: string
  authorHandle: string
  authorImage: string
  content: string
  topicId: string
  topicName: string
  humanScore: number
  likeCount: number
  repostCount: number
  replyCount: number
  createdAt: string
  externalUrl: string
}

let cachedToken: { accessJwt: string; expiresAt: number } | null = null

async function getBlueskySession(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.accessJwt
  }

  const identifier = process.env.BLUESKY_IDENTIFIER
  const password = process.env.BLUESKY_APP_PASSWORD

  if (!identifier || !password) {
    console.error("Missing Bluesky credentials in environment variables")
    return null
  }

  try {
    const res = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    })

    if (!res.ok) {
      console.error("Bluesky login failed with status:", res.status)
      return null
    }

    const data = await res.json()
    cachedToken = {
      accessJwt: data.accessJwt,
      expiresAt: Date.now() + 1000 * 60 * 50,
    }
    return cachedToken.accessJwt
  } catch (err) {
    console.error("Bluesky login error:", err)
    return null
  }
}

export function computeContentHeuristicScore(post: BlueskyPost): number {
  let score = 78
  const text = post.record.text || ""
  const len = text.length

  // Length signal
  if (len < 15) {
    score -= Math.max(0, (15 - len) * 1.5)
  } else if (len >= 40 && len <= 280) {
    score += Math.max(2, 5 - Math.abs(len - 150) * (3 / 110))
  } else if (len > 280) {
    score -= Math.min(8, 3 + (len - 280) * 0.05)
  }

  const likes = post.likeCount ?? 0
  const reposts = post.repostCount ?? 0
  const replies = post.replyCount ?? 0

  // Engagement health signal
  if (likes > 0 && replies > 0 && reposts > 0) {
    const minEng = Math.min(likes, replies, reposts)
    const maxEng = Math.max(likes, replies, reposts)
    const ratio = maxEng > 0 ? minEng / maxEng : 0
    score += 3 + 5 * ratio
  }

  if (reposts > likes * 3 && reposts > 10) {
    score -= 15
  }

  if (likes === 0 && reposts === 0 && replies === 0 && len > 100) {
    score -= Math.min(6, 3 + (len - 100) * 0.03)
  }

  // Hashtag signal
  const hashtagCount = (text.match(/#/g) || []).length
  if (hashtagCount > 3) {
    score -= Math.min(15, (hashtagCount - 3) * 3)
  }

  // Link signal
  const linkCount = (text.match(/https?:\/\//g) || []).length
  if (linkCount > 1) {
    score -= Math.min(12, (linkCount - 1) * 4)
  }

  // Spam pattern signal
  if (/(.)\1{4,}/.test(text)) {
    score -= 25
  }

  return Math.max(25, Math.min(98, Math.round(score)))
}

export async function searchBlueskyPosts(
  query: string,
  topicId: string,
  topicName: string,
  limit = 12
): Promise<DiscoverPost[]> {
  const token = await getBlueskySession()
  if (!token) return []

  const url = `https://bsky.social/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(query)}&limit=${limit}&lang=en`

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    })

    if (!res.ok) {
      console.error("Bluesky search returned status:", res.status)
      return []
    }

    const data = await res.json()
    const posts: BlueskyPost[] = data.posts ?? []

    return posts.map(p => ({
      id: p.cid,
      source: "bluesky" as const,
      authorName: p.author.displayName || p.author.handle,
      authorHandle: p.author.handle,
      authorImage: p.author.avatar || "",
      content: p.record.text,
      topicId,
      topicName,
      humanScore: computeContentHeuristicScore(p),
      likeCount: p.likeCount ?? 0,
      repostCount: p.repostCount ?? 0,
      replyCount: p.replyCount ?? 0,
      createdAt: p.record.createdAt,
      externalUrl: `https://bsky.app/profile/${p.author.handle}/post/${p.uri.split("/").pop()}`,
    }))
  } catch (err) {
    console.error("Bluesky search error:", err)
    return []
  }
}
