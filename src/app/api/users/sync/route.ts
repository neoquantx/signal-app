import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getItem, putItem } from "@/lib/dynamo"

export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id!
  const existing = await getItem(`USER#${userId}`, "PROFILE")

  if (!existing) {
    await putItem({
      PK: `USER#${userId}`,
      SK: "PROFILE",
      id: userId,
      name: session.user.name ?? "Anonymous",
      email: session.user.email ?? "",
      image: session.user.image ?? "",
      humanScore: 100,
      topicIds: [],
      createdAt: new Date().toISOString(),
    })
  }

  return NextResponse.json({ success: true })
}
