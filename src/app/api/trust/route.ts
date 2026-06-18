import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { putItem, deleteItem, queryItems } from "@/lib/dynamo"
import { getTopicName } from "@/lib/topics"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { trusteeId, topicId } = await req.json()
  if (!trusteeId || !topicId) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const trusterId = (session.user as { id?: string }).id!
  if (trusterId === trusteeId) return NextResponse.json({ error: "Cannot trust yourself" }, { status: 400 })

  await putItem({
    PK: `USER#${trusterId}`,
    SK: `TRUST#${topicId}#${trusteeId}`,
    trusterId,
    trusteeId,
    topicId,
    topicName: getTopicName(topicId),
    createdAt: new Date().toISOString(),
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { trusteeId, topicId } = await req.json()
  const trusterId = (session.user as { id?: string }).id!

  await deleteItem(`USER#${trusterId}`, `TRUST#${topicId}#${trusteeId}`)
  return NextResponse.json({ success: true })
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id!
  const items = await queryItems(`USER#${userId}`, "TRUST#")
  return NextResponse.json({ trusts: items })
}
