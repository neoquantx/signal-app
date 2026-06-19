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

function computeContentHeuristicScore(post: BlueskyPost): number {
  let score = 90
  const text = post.record.text || ""
  const len = text.length

  if (len < 15) score -= 15

  const hashtagCount = (text.match(/#/g) || []).length
  if (hashtagCount > 4) score -= 20

  const linkCount = (text.match(/https?:\/\//g) || []).length
  if (linkCount > 1) score -= 10

  const likes = post.likeCount ?? 0
  const reposts = post.repostCount ?? 0
  if (reposts > 0 && likes === 0 && reposts > 5) score -= 15

  if (likes === 0 && reposts === 0 && (post.replyCount ?? 0) === 0 && len > 200) score -= 8

  if (/(.)\1{4,}/.test(text)) score -= 25

  return Math.max(20, Math.min(99, Math.round(score)))
}

export async function searchBlueskyPosts(
  query: string,
  topicId: string,
  topicName: string,
  limit = 12
): Promise<DiscoverPost[]> {
  const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(query)}&limit=${limit}&lang=en`

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept": "application/json",
      "Origin": "https://bsky.app",
      "Referer": "https://bsky.app/",
    },
  })

  if (!res.ok) {
    console.error("Bluesky API returned status:", res.status)
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
}
