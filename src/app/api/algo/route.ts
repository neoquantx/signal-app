import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getItem, putItem } from "@/lib/dynamo"

const DEFAULT_PREFS = { trustChainWeight: 65, topicRelevanceWeight: 25, recencyWeight: 10 }

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as { id?: string }).id!
  const item = await getItem(`USER#${userId}`, "ALGO")
  return NextResponse.json({ prefs: item ?? { ...DEFAULT_PREFS, userId } })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as { id?: string }).id!
  const { trustChainWeight, topicRelevanceWeight, recencyWeight } = await req.json()
  await putItem({
    PK: `USER#${userId}`, SK: "ALGO",
    userId, trustChainWeight, topicRelevanceWeight, recencyWeight,
    updatedAt: new Date().toISOString(),
  })
  return NextResponse.json({ success: true })
}
