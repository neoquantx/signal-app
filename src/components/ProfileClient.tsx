"use client"
import { useEffect, useState } from "react"
import { Post } from "@/types"
import PostCard from "./PostCard"
import { ShieldCheck } from "lucide-react"

interface Props {
  userId: string
  name: string
  image?: string
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export default function ProfileClient({ userId, name, image }: Props) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((d) => {
        setPosts((d.posts ?? []).filter((p: Post) => p.authorId === userId))
        setLoading(false)
      })
  }, [userId])

  const avgHuman = posts.length
    ? Math.round(posts.reduce((s, p) => s + p.humanScore, 0) / posts.length)
    : 96

  return (
    <div>
      {/* Profile header */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          {image ? (
            <img src={image || "/placeholder.svg"} className="h-16 w-16 rounded-full" alt="" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground">
              {initials(name)}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">{name}</h1>
            <p className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-verified">
              <ShieldCheck className="h-3.5 w-3.5" />
              {avgHuman}% human score
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-5">
          <Stat label="Posts" value={posts.length} />
          <Stat label="Avg human" value={`${avgHuman}%`} />
          <Stat label="Trust given" value={posts.reduce((s, p) => s + (p.trustCount ?? 0), 0)} />
        </div>
      </div>

      {/* Posts */}
      <h2 className="mb-3 mt-6 text-sm font-semibold text-foreground">Your posts</h2>
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm font-medium text-foreground">No posts yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Share something worth trusting to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} currentUserId={userId} />
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-semibold text-foreground tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
