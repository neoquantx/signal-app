import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { searchBlueskyPosts } from "@/lib/bluesky"
import { getTopicById } from "@/lib/topics"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)

  // Free-text search: when `q` is provided, skip topic list lookup
  const freeQuery = searchParams.get("q")?.trim()
  if (freeQuery) {
    const topicName = freeQuery.charAt(0).toUpperCase() + freeQuery.slice(1)
    try {
      const posts = await searchBlueskyPosts(freeQuery, "custom", topicName)
      return NextResponse.json({ posts })
    } catch (err) {
      console.error("Bluesky search error (free query):", err)
      return NextResponse.json({ posts: [] })
    }
  }

  // Standard topic-based search
  const topicId = searchParams.get("topic") ?? "ai"
  const topic = getTopicById(topicId)
  if (!topic) return NextResponse.json({ error: "Unknown topic" }, { status: 400 })

  try {
    const posts = await searchBlueskyPosts(topic.searchQuery, topic.id, topic.name)
    return NextResponse.json({ posts })
  } catch (err) {
    console.error("Bluesky fetch error:", err)
    return NextResponse.json({ posts: [] })
  }
}
