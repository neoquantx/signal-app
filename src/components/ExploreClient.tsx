"use client"
import { useEffect, useState } from "react"
import { DEFAULT_TOPICS } from "@/lib/topics"

interface User {
  id: string
  name: string
  image: string
  humanScore: number
}

export default function ExploreClient({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<User[]>([])
  const [trustedMap, setTrustedMap] = useState<Record<string, Record<string, boolean>>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/users").then(r => r.json()),
      fetch("/api/trust").then(r => r.json()),
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
    setTrustedMap(prev => ({
      ...prev,
      [trusteeId]: { ...prev[trusteeId], [topicId]: !already }
    }))
    await fetch("/api/trust", {
      method: already ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trusteeId, topicId }),
    })
  }

  if (loading) return (
    <div className="space-y-3">
      {[1,2].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 bg-gray-100 rounded-full" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )

  if (users.length === 0) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
      <p className="text-sm text-gray-500">No other users yet</p>
      <p className="text-xs text-gray-400 mt-1">Share Signal with others to build your trust network</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {users.map(user => (
        <div key={user.id} className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            {user.image && <img src={user.image} className="w-10 h-10 rounded-full" alt="" />}
            <div>
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-400">{user.humanScore}% human score</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-2">Trust this person on:</p>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_TOPICS.slice(0, 6).map(topic => {
              const isTrusted = trustedMap[user.id]?.[topic.id]
              return (
                <button
                  key={topic.id}
                  onClick={() => handleTrust(user.id, topic.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    isTrusted
                      ? "bg-blue-50 border-blue-200 text-blue-600"
                      : "border-gray-200 text-gray-500 hover:border-blue-200 hover:text-blue-600"
                  }`}
                >
                  {isTrusted ? "✓ " : ""}{topic.name}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
