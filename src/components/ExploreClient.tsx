"use client"
import { useEffect, useState } from "react"
import { DEFAULT_TOPICS } from "@/lib/topics"
import { ShieldCheck, Check } from "lucide-react"

interface User {
  id: string
  name: string
  image: string
  humanScore: number
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export default function ExploreClient({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<User[]>([])
  const [trustedMap, setTrustedMap] = useState<Record<string, Record<string, boolean>>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/trust").then((r) => r.json()),
    ]).then(([ud, td]) => {
      setUsers(ud.users ?? [])
      const map: Record<string, Record<string, boolean>> = {}
      for (const t of td.trusts ?? []) {
        if (!map[t.trusteeId]) map[t.trusteeId] = {}
        map[t.trusteeId][t.topicId] = true
      }
      setTrustedMap(map)
      setLoading(false)
    })
  }, [])

  async function handleTrust(trusteeId: string, topicId: string) {
    const already = trustedMap[trusteeId]?.[topicId]
    setTrustedMap((prev) => ({
      ...prev,
      [trusteeId]: { ...prev[trusteeId], [topicId]: !already },
    }))
    await fetch("/api/trust", {
      method: already ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trusteeId, topicId }),
    })
  }

  if (loading)
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex animate-pulse items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="h-3 w-1/3 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )

  if (users.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm font-medium text-foreground">No other people yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Share Signal to start building your trust network.</p>
      </div>
    )

  return (
    <div className="space-y-3">
      {users.map((user) => {
        const tone =
          user.humanScore >= 90 ? "text-verified" : user.humanScore >= 70 ? "text-suspicious" : "text-bot"
        return (
          <div key={user.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-3">
              {user.image ? (
                <img src={user.image || "/placeholder.svg"} className="h-10 w-10 rounded-full" alt="" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                  {initials(user.name)}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                <p className={`flex items-center gap-1 text-xs font-medium ${tone}`}>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {user.humanScore}% human score
                </p>
              </div>
            </div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Trust this person on:</p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_TOPICS.slice(0, 6).map((topic) => {
                const isTrusted = trustedMap[user.id]?.[topic.id]
                return (
                  <button
                    key={topic.id}
                    onClick={() => handleTrust(user.id, topic.id)}
                    className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      isTrusted
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    {isTrusted && <Check className="h-3 w-3" />}
                    {topic.name.split(" ")[0]}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
