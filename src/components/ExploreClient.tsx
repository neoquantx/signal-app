"use client"
import { useEffect, useState } from "react"
import { DEFAULT_TOPICS } from "@/lib/topics"
import { Search, UserSearch, CheckCircle2 } from "lucide-react"

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
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="h-8 bg-surface-elevated rounded w-48 mb-2 animate-pulse" />
          <div className="h-4 bg-surface-elevated rounded w-64 animate-pulse" />
        </div>
      </div>
      
      <div className="h-12 bg-surface-elevated rounded-2xl animate-pulse" />

      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-panel rounded-[32px] p-6 animate-pulse h-48 bg-surface-elevated" />
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary drop-shadow-sm">Explore people</h1>
          <p className="text-sm text-text-secondary mt-1">Trust people on specific topics to build your network</p>
        </div>
        <span className="text-xs font-semibold text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-full border border-brand-primary/20 shadow-sm">Verified Directory</span>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-primary">
          <Search className="w-5 h-5 text-text-tertiary" />
        </div>
        <input
          id="explore-search"
          type="text"
          placeholder="Search verified members by name..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="block w-full pl-12 pr-4 py-3.5 border border-surface-border rounded-2xl bg-surface-elevated placeholder-text-tertiary text-text-primary caret-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary/50 transition-all shadow-sm hover:bg-surface-glass-hover"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="glass-panel rounded-[32px] border border-surface-border p-16 text-center shadow-sm transition-all duration-300 hover:scale-[1.005]">
          <div className="w-20 h-20 bg-surface-base rounded-full flex items-center justify-center mx-auto mb-6 border border-surface-border">
            <UserSearch className="text-text-tertiary w-10 h-10" />
          </div>
          <p className="text-lg font-semibold text-text-primary">No users match your query</p>
          <p className="text-sm text-text-secondary mt-2">Try searching with a different name or checking back later</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredUsers.map(user => {
            const userTrust = trustedMap[user.id] || {}
            const trustedTopicsCount = Object.values(userTrust).filter(Boolean).length
            const trustLevel = Math.min(5, trustedTopicsCount)

            return (
              <div key={user.id} className="glass-panel rounded-[32px] p-6 shadow-sm transition-all">
                <div className="flex items-center gap-3.5 mb-5">
                  {user.image ? (
                    <img src={user.image} className="w-12 h-12 rounded-full object-cover border border-surface-border shadow-sm" alt={user.name} />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center font-bold text-lg shadow-sm">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-text-primary hover:text-brand-primary hover:underline cursor-pointer">{user.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full text-status-success bg-status-success/10 border border-status-success/20">
                        {user.humanScore}% HUMAN
                      </span>
                      <span className="text-xs text-text-tertiary">·</span>
                      <span className="text-xs text-text-secondary font-medium flex items-center gap-1">
                        Trust network: <strong className="text-text-primary font-semibold">{trustedTopicsCount} {trustedTopicsCount === 1 ? 'topic' : 'topics'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 mb-5 px-1 flex-wrap">
                  <span className="text-[11px] font-bold text-text-secondary tracking-wide uppercase">Trust Level:</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((step) => {
                      const active = trustLevel >= step
                      return (
                        <div
                          key={step}
                          className={`w-8 h-2 rounded-full transition-all duration-300 ${
                            active
                              ? trustLevel >= 4
                                ? "bg-status-success shadow-[0_0_8px_rgba(34,197,94,0.3)]" 
                                : trustLevel >= 2
                                ? "bg-brand-primary shadow-[0_0_8px_rgba(17,133,254,0.3)]" 
                                : "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.3)]"
                              : "bg-surface-border"
                          }`}
                          title={`${trustLevel} topics trusted`}
                        />
                      )
                    })}
                  </div>
                </div>

                <p className="text-[11px] font-semibold text-text-secondary mb-3 px-1 uppercase tracking-wide">Trust this person on:</p>
                <div className="flex flex-wrap gap-2 px-1">
                  {DEFAULT_TOPICS.slice(0, 6).map(topic => {
                    const isTrusted = !!userTrust[topic.id]
                    return (
                      <button
                        key={topic.id}
                        onClick={() => handleTrust(user.id, topic.id)}
                        className={`text-xs px-4 py-2 rounded-full transition-all duration-200 cursor-pointer ${
                          isTrusted
                            ? "bg-brand-primary text-white font-semibold shadow-sm"
                            : "bg-surface-base border border-surface-border text-text-secondary hover:bg-surface-glass-hover hover:text-text-primary"
                        }`}
                      >
                        {isTrusted ? (
                          <span className="inline-flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
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
