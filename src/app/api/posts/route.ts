import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { putItem, scanItems } from "@/lib/dynamo"
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

  const items = await scanItems("SK = :sk", { ":sk": "META" })
  const posts = items
    .filter(item => item.PK?.startsWith("POST#"))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({ posts })
}
