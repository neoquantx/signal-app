import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { scanItems } from "@/lib/dynamo"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const currentUserId = (session.user as { id?: string }).id!
  const items = await scanItems("SK = :sk", { ":sk": "PROFILE" })
  const users = items
    .filter(item => item.PK?.startsWith("USER#") && item.id !== currentUserId)
    .map(item => ({
      id: item.id,
      name: item.name,
      image: item.image,
      humanScore: item.humanScore,
    }))

  return NextResponse.json({ users })
}
