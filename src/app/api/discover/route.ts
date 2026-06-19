import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { searchBlueskyPosts } from "@/lib/bluesky"
import { getTopicById } from "@/lib/topics"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
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
