"use client"
import { useEffect, useState } from "react"
import { Post } from "@/types"
import { DEFAULT_TOPICS } from "@/lib/topics"
import { TrendingUp, ShieldCheck } from "lucide-react"

interface TopicStat {
  id: string
  name: string
  posts: number
  avgHuman: number
}

export default function TrendingClient() {
  const [stats, setStats] = useState<TopicStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((d) => {
        const posts: Post[] = d.posts ?? []
        const map = new Map<string, { posts: number; human: number }>()
        for (const p of posts) {
          const cur = map.get(p.topicId) ?? { posts: 0, human: 0 }
          cur.posts += 1
          cur.human += p.humanScore
          map.set(p.topicId, cur)
        }
        const result: TopicStat[] = [...map.entries()]
          .map(([id, v]) => ({
            id,
            name: DEFAULT_TOPICS.find((t) => t.id === id)?.name ?? id,
            posts: v.posts,
            avgHuman: Math.round(v.human / v.posts),
          }))
          .sort((a, b) => b.posts - a.posts)
        setStats(result)
        setLoading(false)
      })
  }, [])

  if (loading)
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
    )

  if (stats.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm font-medium text-foreground">Nothing trending yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Topics appear here as people post.</p>
      </div>
    )

  return (
    <div className="space-y-3">
      {stats.map((s, i) => (
        <div
          key={s.id}
          className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-[0_2px_16px_-4px_rgba(15,23,42,0.08)]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-primary">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <span className="text-primary">#</span>
              {s.name}
            </p>
            <p className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {s.posts} post{s.posts !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1 text-verified">
                <ShieldCheck className="h-3 w-3" />
                {s.avgHuman}% avg human
              </span>
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
