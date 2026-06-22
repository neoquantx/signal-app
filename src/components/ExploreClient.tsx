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
  const [searchQuery, setSearchQuery] = useState("")

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

  // Filter users by search input
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) return (
    <div>
      {/* Search Bar Skeleton */}
      <div className="h-10 bg-surface-secondary rounded-xl mb-6 animate-pulse" />
      
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-surface rounded-3xl border border-border-app p-5 animate-pulse space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-surface-secondary rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface-secondary rounded w-1/4" />
                <div className="h-3.5 bg-surface-secondary rounded w-28" />
              </div>
            </div>
            {/* Visual Meter Skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-3 bg-surface-secondary rounded w-20" />
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(j => (
                  <div key={j} className="w-6 h-1.5 bg-surface-secondary rounded-full" />
                ))}
              </div>
            </div>
            {/* Chips Grid Skeleton */}
            <div className="flex flex-wrap gap-2 pt-1.5">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="h-7 bg-surface-secondary rounded-full w-24" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <label htmlFor="explore-search" className="sr-only">Search members</label>
        <input
          id="explore-search"
          type="text"
          placeholder="Search verified members by name..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-4 py-2.5 border border-border-app rounded-xl bg-surface text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all shadow-sm"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="bg-surface rounded-3xl border border-border-app p-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-text-secondary">No users match your query</p>
          <p className="text-xs text-text-tertiary mt-1">Try searching with a different name</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map(user => {
            const userTrust = trustedMap[user.id] || {}
            const trustedTopicsCount = Object.values(userTrust).filter(Boolean).length
            const trustLevel = Math.min(5, trustedTopicsCount)

            return (
              <div key={user.id} className="bg-surface rounded-3xl border border-border-app p-5 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-3.5 mb-4">
                  {user.image ? (
                    <img src={user.image} className="w-11 h-11 rounded-full object-cover border border-border-app shadow-sm" alt={user.name} />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-accent-soft border border-border-app text-accent flex items-center justify-center font-bold text-base shadow-sm">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary hover:underline cursor-pointer">{user.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {/* humanScore badge — semantic emerald preserved */}
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/40">
                        {user.humanScore}% human
                      </span>
                      <span className="text-xs text-text-tertiary">·</span>
                      
                      {/* Trust network count */}
                      <span className="text-xs text-text-secondary font-medium flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.97 5.97 0 00-.75-2.985m-.3-8.278a4 4 0 11-5.714 5.714m5.714-5.714a3 3 0 11-5.714 0M3.124 7.5A8.969 8.969 0 002.63 12c0 2.186.783 4.19 2.08 5.756M20.876 7.5A8.969 8.969 0 0121.37 12c0 2.186-.783 4.19-2.08 5.756M12 3c1.785 0 3.447.519 4.852 1.416M7.148 4.416A8.97 8.97 0 0112 3" />
                        </svg>
                        Trust network: <strong className="text-text-primary font-semibold">{trustedTopicsCount} {trustedTopicsCount === 1 ? 'topic' : 'topics'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Topic Trust Visual Indicator (0-5 topics trusted) */}
                <div className="flex items-center gap-3.5 mb-4 px-1 flex-wrap">
                  <span className="text-[11px] font-bold text-text-secondary tracking-wide uppercase">Trust Level:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((step) => {
                      const active = trustLevel >= step
                      return (
                        <div
                          key={step}
                          className={`w-6.5 h-1.5 rounded-full transition-all duration-300 ${
                            active
                              ? trustLevel >= 4
                                ? "bg-[#16A34A]" // High trust: semantic green
                                : trustLevel >= 2
                                ? "bg-accent"     // Medium trust: brand accent
                                : "bg-[#F59E0B]"  // Low trust: semantic amber
                              : "bg-surface-secondary"
                          }`}
                          title={`${trustLevel} topics trusted`}
                        />
                      )
                    })}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                    trustLevel === 0
                      ? "text-text-secondary bg-surface-secondary border border-border-app"
                      : trustLevel === 1
                      ? "text-amber-700 bg-amber-50 border border-amber-100/40"
                      : trustLevel >= 4
                      ? "text-emerald-700 bg-emerald-50 border border-emerald-100/40"
                      : "text-accent bg-accent-soft border border-accent/20"
                  }`}>
                    {trustLevel === 0
                      ? "Unlinked"
                      : trustLevel === 1
                      ? "Acquaintance"
                      : trustLevel === 2
                      ? "Trusted"
                      : trustLevel === 3
                      ? "Strong"
                      : trustLevel === 4
                      ? "Advocate"
                      : "Partner"}
                  </span>
                </div>

                <p className="text-[11px] font-semibold text-text-secondary mb-2.5 px-1 uppercase tracking-wide">Trust this person on:</p>
                <div className="flex flex-wrap gap-2 px-1">
                  {DEFAULT_TOPICS.slice(0, 6).map(topic => {
                    const isTrusted = !!userTrust[topic.id]
                    return (
                      <button
                        key={topic.id}
                        onClick={() => handleTrust(user.id, topic.id)}
                        className={`text-xs px-3.5 py-2 rounded-full border transition-all duration-200 cursor-pointer ${
                          isTrusted
                            ? "bg-accent-soft border-accent text-accent font-semibold shadow-sm"
                            : "bg-surface border-border-app text-text-secondary hover:border-accent/40 hover:text-accent"
                        }`}
                      >
                        {isTrusted ? (
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3 h-3 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            {topic.name}
                          </span>
                        ) : (
                          topic.name
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
