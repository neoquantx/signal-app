import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { putItem, scanItems, getItem } from "@/lib/dynamo"
import { getTopicName } from "@/lib/topics"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { content, topicId, topicName: topicNameFromBody, humanScore } = await req.json()
  if (!content || !topicId) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const userId = (session.user as { id?: string }).id!
  const postId = uuidv4()
  const createdAt = new Date().toISOString()

  const post = {
    PK: `POST#${postId}`,
    SK: "META",
    id: postId,
    authorId: userId,
    authorName: session.user.name ?? "Anonymous",
    authorImage: session.user.image ?? "",
    content,
    topicId,
    topicName: topicNameFromBody ?? getTopicName(topicId),
    humanScore: Math.round(humanScore ?? 85),
    trustCount: 0,
    createdAt,
  }

  await putItem(post)
  return NextResponse.json({ post }, { status: 201 })
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id!

  const [items, algoItem] = await Promise.all([
    scanItems("SK = :sk", { ":sk": "META" }),
    getItem(`USER#${userId}`, "ALGO")
  ])

  const prefs = algoItem ?? { trustChainWeight: 65, topicRelevanceWeight: 25, recencyWeight: 10 }

  const now = Date.now()
  const posts = items
    .filter(item => item.PK?.startsWith("POST#"))
    .map(post => {
      const trustScore = post.humanScore ?? 50
      const topicScore = 100 // Fully relevant
      const hoursOld = (now - new Date(post.createdAt).getTime()) / (1000 * 60 * 60)
      const recencyScore = Math.max(0, 100 - hoursOld * (100 / 48))

      const finalScore = 
        (trustScore * (prefs.trustChainWeight / 100)) + 
        (topicScore * (prefs.topicRelevanceWeight / 100)) + 
        (recencyScore * (prefs.recencyWeight / 100))

      return { ...post, _algoScore: finalScore }
    })
    .sort((a, b) => b._algoScore - a._algoScore)

  return NextResponse.json({ posts })
}
