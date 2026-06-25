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
          <div className="h-8 bg-white/10 rounded w-48 mb-2 animate-pulse" />
          <div className="h-4 bg-white/10 rounded w-64 animate-pulse" />
        </div>
      </div>
      
      <div className="h-12 bg-white/5 rounded-2xl animate-pulse" />

      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-panel rounded-[32px] p-6 animate-pulse h-48" />
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">Explore people</h1>
          <p className="text-sm text-white/70 mt-1">Trust people on specific topics to build your network</p>
        </div>
        <span className="text-xs font-semibold text-accent-cream bg-accent-green/60 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md shadow-lg">Verified Directory</span>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-white">
          <Search className="w-5 h-5 text-white/50" />
        </div>
        <input
          id="explore-search"
          type="text"
          placeholder="Search verified members by name..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="block w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-xl placeholder-white/30 text-white caret-accent-green focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green/50 transition-all shadow-xl hover:bg-white/10"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="dark-glass-panel rounded-[32px] border border-white/10 p-16 text-center shadow-2xl transition-all duration-300 hover:scale-[1.005] hover:border-white/20">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
            <UserSearch className="text-white/30 w-10 h-10" />
          </div>
          <p className="text-lg font-semibold text-accent-cream">No users match your query</p>
          <p className="text-sm text-white/50 mt-2">Try searching with a different name or checking back later</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredUsers.map(user => {
            const userTrust = trustedMap[user.id] || {}
            const trustedTopicsCount = Object.values(userTrust).filter(Boolean).length
            const trustLevel = Math.min(5, trustedTopicsCount)

            return (
              <div key={user.id} className="glass-panel rounded-[32px] p-6 shadow-xl transition-all hover:translate-y-[-2px]">
                <div className="flex items-center gap-3.5 mb-5">
                  {user.image ? (
                    <img src={user.image} className="w-12 h-12 rounded-full object-cover border border-white/20 shadow-sm" alt={user.name} />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-accent-green/20 border border-accent-green/30 text-accent-green flex items-center justify-center font-bold text-lg shadow-sm">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-accent-green hover:underline cursor-pointer">{user.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full text-green-700 bg-green-100 border-green-200">
                        {user.humanScore}% HUMAN
                      </span>
                      <span className="text-xs text-on-surface-variant">·</span>
                      <span className="text-xs text-on-surface-variant font-medium flex items-center gap-1">
                        Trust network: <strong className="text-on-surface font-semibold">{trustedTopicsCount} {trustedTopicsCount === 1 ? 'topic' : 'topics'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 mb-5 px-1 flex-wrap">
                  <span className="text-[11px] font-bold text-on-surface-variant tracking-wide uppercase">Trust Level:</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((step) => {
                      const active = trustLevel >= step
                      return (
                        <div
                          key={step}
                          className={`w-8 h-2 rounded-full transition-all duration-300 ${
                            active
                              ? trustLevel >= 4
                                ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" 
                                : trustLevel >= 2
                                ? "bg-accent-green shadow-[0_0_8px_rgba(84,107,65,0.4)]" 
                                : "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]"
                              : "bg-white/10"
                          }`}
                          title={`${trustLevel} topics trusted`}
                        />
                      )
                    })}
                  </div>
                </div>

                <p className="text-[11px] font-semibold text-on-surface-variant mb-3 px-1 uppercase tracking-wide">Trust this person on:</p>
                <div className="flex flex-wrap gap-2 px-1">
                  {DEFAULT_TOPICS.slice(0, 6).map(topic => {
                    const isTrusted = !!userTrust[topic.id]
                    return (
                      <button
                        key={topic.id}
                        onClick={() => handleTrust(user.id, topic.id)}
                        className={`text-xs px-4 py-2 rounded-full transition-all duration-200 cursor-pointer ${
                          isTrusted
                            ? "bg-accent-green text-white font-semibold shadow-md"
                            : "bg-white/5 border border-white/10 text-on-surface hover:bg-white/10 hover:border-white/20"
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
