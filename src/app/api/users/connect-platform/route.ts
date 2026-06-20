import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getItem, putItem } from "@/lib/dynamo"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as { id?: string }).id!
  const existing = await getItem(`USER#${userId}`, "PROFILE")
  return NextResponse.json({ connectedPlatforms: existing?.connectedPlatforms ?? [] })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { platform } = await req.json()
  if (!platform) return NextResponse.json({ error: "Missing platform" }, { status: 400 })

  const userId = (session.user as { id?: string }).id!
  const existing = await getItem(`USER#${userId}`, "PROFILE")

  const connectedPlatforms: string[] = (existing?.connectedPlatforms as string[]) ?? []
  if (!connectedPlatforms.includes(platform)) {
    connectedPlatforms.push(platform)
  }

  await putItem({
    ...(existing ?? {
      PK: `USER#${userId}`,
      SK: "PROFILE",
      id: userId,
      name: session.user.name ?? "Anonymous",
      email: session.user.email ?? "",
      image: session.user.image ?? "",
      humanScore: 100,
      topicIds: [],
      createdAt: new Date().toISOString(),
    }),
    connectedPlatforms,
  })

  return NextResponse.json({ success: true, connectedPlatforms })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { platform } = await req.json()
  const userId = (session.user as { id?: string }).id!
  const existing = await getItem(`USER#${userId}`, "PROFILE")

  const connectedPlatforms: string[] = ((existing?.connectedPlatforms as string[]) ?? []).filter(
    p => p !== platform
  )

  await putItem({
    ...(existing ?? {
      PK: `USER#${userId}`,
      SK: "PROFILE",
      id: userId,
      name: session.user.name ?? "Anonymous",
      email: session.user.email ?? "",
      image: session.user.image ?? "",
      humanScore: 100,
      topicIds: [],
      createdAt: new Date().toISOString(),
    }),
    connectedPlatforms,
  })

  return NextResponse.json({ success: true, connectedPlatforms })
}
