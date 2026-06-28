"use client"
import { useEffect, useState } from "react"
import { getTopicsByCategory, type Topic } from "@/lib/topics"
import TiltCard from "@/components/TiltCard"
import { Heart, MessageCircle, Repeat, Bookmark, BadgeCheck } from "lucide-react"

interface DiscoverPost {
  id: string
  source: string
  authorName: string
  authorHandle: string
  authorImage: string
  content: string
  topicId: string
  topicName: string
  humanScore: number
  likeCount: number
  repostCount: number
  replyCount: number
  createdAt: string
  externalUrl: string
}

interface MyFeedPost {
  id: string
  authorName: string
  authorHandle: string
  authorImage: string
  content: string
  humanScore: number
  likeCount: number
  repostCount: number
  replyCount: number
  createdAt: string
  externalUrl: string
  isRepost: boolean
  repostedBy?: string
}

type ActiveTab = "topic" | "network"

function scoreColorClass(score: number) {
  return score >= 90
    ? "text-status-success bg-status-success/10 border-status-success/20"
    : score >= 70
    ? "text-yellow-600 bg-yellow-400/10 border-yellow-400/20"
    : "text-status-error bg-status-error/10 border-status-error/20"
}

export default function DiscoverClient() {
  const grouped = getTopicsByCategory()
  const categories = Object.keys(grouped)

  const [activeTab, setActiveTab] = useState<ActiveTab>("topic")

  // By-Topic state
  const [activeTopic, setActiveTopic] = useState("ai")
  const [posts, setPosts] = useState<DiscoverPost[]>([])
  const [topicLoading, setTopicLoading] = useState(true)
  const [trustedHandles, setTrustedHandles] = useState<Record<string, boolean>>({})

  // Free-text search state (By Topic tab only)
  const [searchInput, setSearchInput] = useState("")
  const [activeSearchQuery, setActiveSearchQuery] = useState<string | null>(null)

  // Your Network state
  const [networkStatus, setNetworkStatus] = useState<{
    checked: boolean
    connected: boolean
    handle?: string
  }>({ checked: false, connected: false })
  const [networkPosts, setNetworkPosts] = useState<MyFeedPost[]>([])
  const [networkLoading, setNetworkLoading] = useState(false)
  const [networkError, setNetworkError] = useState<string | null>(null)

  useEffect(() => {
    if (activeTab !== "topic") return
    const timer = setTimeout(() => {
      setTopicLoading(true)
    }, 0)
    const url = activeSearchQuery
      ? `/api/discover?q=${encodeURIComponent(activeSearchQuery)}`
      : `/api/discover?topic=${activeTopic}`
    fetch(url)
      .then(r => r.json())
      .then(d => { setPosts(d.posts ?? []); setTopicLoading(false) })
      .catch(() => setTopicLoading(false))
    return () => clearTimeout(timer)
  }, [activeTopic, activeTab, activeSearchQuery])

  useEffect(() => {
    if (activeTab !== "network") return
    if (networkStatus.checked) return

    fetch("/api/bluesky-oauth/status")
      .then(r => r.json())
      .then((d: { connected: boolean; handle?: string }) => {
        setNetworkStatus({ checked: true, connected: d.connected, handle: d.handle })

        if (!d.connected) return

        setNetworkLoading(true)
        setNetworkError(null)
        return fetch("/api/bluesky-oauth/my-feed")
          .then(r => r.json())
          .then((feed: { posts: MyFeedPost[]; connected: boolean; error?: string }) => {
            setNetworkPosts(feed.posts ?? [])
            if (feed.error) setNetworkError(feed.error)
            setNetworkLoading(false)
          })
      })
      .catch(() => {
        setNetworkStatus({ checked: true, connected: false })
        setNetworkLoading(false)
      })
  }, [activeTab, networkStatus.checked])

  async function handleTrust(handle: string, topicId: string) {
    const key = `${handle}-${topicId}`
    setTrustedHandles(prev => ({ ...prev, [key]: true }))
    await fetch("/api/trust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trusteeId: `bluesky:${handle}`, topicId }),
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary mb-2">Discover</h1>
        <p className="text-text-secondary text-sm font-medium">Real posts from the open web, scored for authenticity by Signal</p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setActiveTab("topic")}
            className={`text-sm px-6 py-2 rounded-full transition-all border ${
              activeTab === "topic"
                ? "font-semibold bg-text-primary text-white border-text-primary shadow-sm"
                : "font-medium bg-surface-elevated text-text-secondary border-surface-border hover:bg-surface-glass-hover hover:text-text-primary"
            }`}
          >
            By Topic
          </button>
          <button
            onClick={() => setActiveTab("network")}
            className={`text-sm px-6 py-2 rounded-full transition-all border ${
              activeTab === "network"
                ? "font-semibold bg-text-primary text-white border-text-primary shadow-sm"
                : "font-medium bg-surface-elevated text-text-secondary border-surface-border hover:bg-surface-glass-hover hover:text-text-primary"
            }`}
          >
            Your Network
          </button>
        </div>
      </div>

      {activeTab === "topic" && (
        <div className="flex flex-col lg:flex-row justify-center gap-8 items-start max-w-5xl mx-auto">
          <aside className="w-full lg:w-[280px] shrink-0 glass-panel p-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-none shadow-sm rounded-3xl border border-surface-border bg-surface-elevated">
            <h2 className="text-xs font-extrabold text-brand-primary uppercase tracking-widest mb-4">Top Categories</h2>
            
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-4 border-b border-surface-border">
              {Object.values(grouped).flat().map((t: Topic) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTopic(t.id)}
                  className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors flex-shrink-0 ${
                    activeTopic === t.id
                      ? "bg-brand-primary text-white font-medium shadow-sm"
                      : "text-text-secondary bg-surface-base hover:text-brand-primary"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            <div className="hidden lg:block space-y-6">
              {categories.map((cat, i) => (
                <div key={cat} className={i !== 0 ? "pt-6 border-t border-surface-border" : ""}>
                  <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest mb-3">{cat}</p>
                  <div className="space-y-1">
                    {grouped[cat].map((t: Topic) => (
                      <button
                        key={t.id}
                        onClick={() => setActiveTopic(t.id)}
                        className={`w-full text-left text-sm px-3 py-2.5 rounded-xl transition-all ${
                          activeTopic === t.id
                            ? "bg-brand-primary text-white font-semibold shadow-sm"
                            : "text-text-secondary hover:bg-surface-glass-hover hover:text-text-primary"
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <section className="flex-1 w-full max-w-2xl space-y-6">
            {/* Free-text search input — By Topic tab only */}
            <form
              onSubmit={e => {
                e.preventDefault()
                const q = searchInput.trim()
                if (q) {
                  setActiveSearchQuery(q)
                } else {
                  setActiveSearchQuery(null)
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search any topic on Bluesky…"
                className="flex-1 text-sm px-4 py-2.5 rounded-full border border-surface-border bg-surface-elevated text-text-primary placeholder-text-tertiary focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-sm"
              />
              <button
                type="submit"
                className="btn-primary text-sm px-5 py-2.5 rounded-full shrink-0 shadow-sm"
              >
                Search
              </button>
              {activeSearchQuery && (
                <button
                  type="button"
                  onClick={() => { setActiveSearchQuery(null); setSearchInput("") }}
                  className="text-sm px-4 py-2.5 rounded-full bg-surface-elevated text-text-secondary border border-surface-border hover:bg-surface-glass-hover hover:text-text-primary font-medium transition-all shrink-0 shadow-sm"
                >
                  ✕ Clear
                </button>
              )}
            </form>

            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-brand-primary animate-pulse"></span>
                <h2 className="text-sm font-bold text-text-primary uppercase tracking-tight">
                  {activeSearchQuery ? `Search results for "${activeSearchQuery}"` : "Live from Bluesky · Scored by Signal"}
                </h2>
              </div>
              <span className="text-[11px] font-medium text-text-tertiary hidden sm:block">Real posts, real authenticity check</span>
            </div>

            {topicLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="glass-panel rounded-[32px] p-6 animate-pulse h-40 bg-surface-elevated" />
                ))}
              </div>
            )}

            {!topicLoading && posts.length === 0 && (
              <div className="bg-surface-elevated border border-surface-border rounded-[32px] p-20 text-center shadow-sm">
                <p className="text-lg font-medium text-text-primary">Filtering the open web...</p>
                <p className="text-sm text-text-secondary">Curating verified signals for your feed.</p>
              </div>
            )}

            {!topicLoading && posts.map((post, i) => {
              const key = `${post.authorHandle}-${post.topicId}`
              return (
                <div key={post.id} className="animate-fade-in" style={{ animationDelay: `${Math.min(i * 50, 300)}ms`, animationFillMode: 'both' }}>
                  <TiltCard maxTilt={3}>
                    <article className="glass-panel p-6 shadow-sm transition-all border border-surface-border bg-surface-elevated rounded-3xl">
                      <div className="flex gap-3 items-center mb-4">
                        <div className="w-11 h-11 rounded-full bg-brand-primary p-[2px]">
                          {post.authorImage ? (
                            <img src={post.authorImage} className="w-full h-full rounded-full object-cover border-2 border-surface-elevated" alt="" />
                          ) : (
                            <div className="w-full h-full rounded-full bg-surface-base border-2 border-surface-elevated" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-text-primary hover:text-brand-primary cursor-pointer">{post.authorName}</h3>
                            <BadgeCheck className="w-4 h-4 text-brand-primary" />
                          </div>
                          <p className="text-xs text-text-secondary">@{post.authorHandle}</p>
                        </div>
                        <div className={`ml-auto text-[10px] font-bold px-2 py-1 rounded-full border ${scoreColorClass(post.humanScore)}`}>
                          {post.humanScore}% AUTHENTIC
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <span className="inline-block text-[10px] text-brand-primary font-bold bg-brand-primary/10 px-2 py-1 rounded-full uppercase tracking-widest border border-brand-primary/20">
                          {post.topicName}
                        </span>
                      </div>
                      
                      <p className="text-text-primary leading-relaxed text-base mb-4 font-normal">
                        {post.content}
                      </p>

                      <div className="bg-brand-primary/5 rounded-2xl p-4 mb-4 border-l-4 border-brand-primary">
                        <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1">↳ Why you see this</p>
                        <p className="text-xs text-text-secondary">
                          Imported from Bluesky · matched topic <b className="text-text-primary">{post.topicName}</b> · authenticity score computed from content + engagement pattern
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-text-secondary pt-4 border-t border-surface-border">
                        <div className="flex items-center space-x-6">
                          <button className="flex items-center hover:text-brand-accent transition-colors font-medium text-sm">
                            <Heart className="w-4 h-4 mr-2" />
                            <span>{post.likeCount !== undefined ? post.likeCount : 124}</span>
                          </button>
                          <button className="flex items-center hover:text-brand-primary transition-colors font-medium text-sm">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            <span>{post.replyCount !== undefined ? post.replyCount : 18}</span>
                          </button>
                          <button className="flex items-center hover:text-status-success transition-colors font-medium text-sm">
                            <Repeat className="w-4 h-4 mr-2" />
                            <span>{post.repostCount !== undefined ? post.repostCount : 5}</span>
                          </button>
                        </div>
                        <button 
                          onClick={() => handleTrust(post.authorHandle, post.topicId)}
                          disabled={trustedHandles[key]}
                          className={`flex items-center gap-2 text-xs px-4 py-1.5 rounded-full font-bold transition-all ml-auto ${
                            trustedHandles[key]
                              ? "bg-status-success/10 text-status-success border border-status-success/30 cursor-default"
                              : "btn-primary px-4 py-1.5 shadow-sm"
                          }`}
                        >
                          {trustedHandles[key] ? "✓ Trusted" : "Trust User"}
                        </button>
                      </div>
                    </article>
                  </TiltCard>
                </div>
              )
            })}
          </section>
        </div>
      )}

      {activeTab === "network" && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-brand-primary animate-pulse"></span>
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-tight">Your Bluesky Network · Scored by Signal</h2>
            </div>
            <span className="text-[11px] font-medium text-text-tertiary">People you follow, authenticity checked</span>
          </div>

          {!networkStatus.checked && !networkLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-panel rounded-[32px] p-6 animate-pulse h-32 bg-surface-elevated" />
              ))}
            </div>
          )}

          {networkStatus.checked && !networkStatus.connected && (
            <div className="glass-panel rounded-[32px] p-10 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center text-3xl">🦋</div>
              <div>
                <p className="text-lg font-bold text-text-primary mb-2">Connect your Bluesky account</p>
                <p className="text-sm text-text-secondary max-w-sm mx-auto">
                  See your real feed from people you follow, scored by Signal for authenticity — no hidden algorithm.
                </p>
              </div>
              <a href="/connect" className="mt-2 btn-primary text-sm px-6 py-3 rounded-full shadow-sm">
                Connect Bluesky →
              </a>
            </div>
          )}

          {networkStatus.connected && networkLoading && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="glass-panel rounded-[32px] p-6 animate-pulse h-40 bg-surface-elevated" />
              ))}
            </div>
          )}

          {networkStatus.connected && !networkLoading && networkError && networkPosts.length === 0 && (
            <div className="glass-panel rounded-[32px] p-10 text-center border border-status-error/30 bg-status-error/5">
              <p className="text-sm text-text-primary font-medium mb-4">{networkError}</p>
              <a href="/connect" className="text-sm text-brand-secondary font-medium hover:underline">
                Reconnect your Bluesky account →
              </a>
            </div>
          )}

          {networkStatus.connected && !networkLoading && !networkError && networkPosts.length === 0 && (
            <div className="glass-panel rounded-[32px] p-10 text-center">
              <div className="text-4xl mb-4 opacity-60">🍃</div>
              <p className="text-lg font-bold text-text-primary mb-2">No posts found</p>
              <p className="text-sm text-text-secondary">
                Follow some accounts on Bluesky to see your feed here.
              </p>
            </div>
          )}

          {networkStatus.connected && !networkLoading && networkPosts.map((post, i) => (
            <div key={post.id} className="animate-fade-in" style={{ animationDelay: `${Math.min(i * 50, 300)}ms`, animationFillMode: 'both' }}>
              <TiltCard maxTilt={3}>
                <article className="glass-panel p-6 shadow-sm transition-all">
                  {post.isRepost && post.repostedBy && (
                    <p className="text-[10px] font-bold text-text-tertiary mb-3 px-1 uppercase tracking-widest bg-surface-base w-max rounded-md border border-surface-border">
                      🔁 Reposted by @{post.repostedBy}
                    </p>
                  )}
                  
                  <div className="flex gap-3 items-center mb-4">
                    <div className="w-11 h-11 rounded-full bg-brand-primary p-[2px]">
                      {post.authorImage ? (
                        <img src={post.authorImage} className="w-full h-full rounded-full object-cover border-2 border-surface-elevated" alt="" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-surface-base border-2 border-surface-elevated" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-text-primary">{post.authorName}</h3>
                        <span className="text-xs text-text-secondary">@{post.authorHandle}</span>
                        <span className="text-[10px] text-brand-primary font-bold bg-brand-primary/10 px-1.5 py-0.5 rounded-full uppercase tracking-tighter border border-brand-primary/20">via Bluesky</span>
                      </div>
                      <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mt-0.5">Post Signal</p>
                    </div>
                    <div className={`ml-auto text-[10px] font-bold px-2 py-1 rounded-full border ${scoreColorClass(post.humanScore)}`}>
                      {post.humanScore}% AUTHENTIC
                    </div>
                  </div>

                  <p className="text-text-primary leading-relaxed text-base mb-4 font-normal">
                    {post.content}
                  </p>

                  <div className="bg-brand-primary/5 rounded-2xl p-4 mb-4 border-l-4 border-brand-primary">
                    <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1">↳ Why you see this</p>
                    <p className="text-xs text-text-secondary">
                      From your Bluesky network — you follow <b className="text-text-primary">@{post.authorHandle}</b>
                      {post.isRepost ? " · shown as a repost" : ""} · authenticity score computed from content + engagement pattern
                    </p>
                  </div>

                  <div className="flex items-center space-x-6 text-xs text-text-secondary pt-4 border-t border-surface-border w-full">
                    <span className="flex items-center hover:text-brand-accent cursor-pointer"><Heart className="w-4 h-4 mr-2" /> <span>{post.likeCount !== undefined ? post.likeCount : 124}</span></span>
                    <span className="flex items-center hover:text-status-success cursor-pointer"><Repeat className="w-4 h-4 mr-2" /> <span>{post.repostCount !== undefined ? post.repostCount : 5}</span></span>
                    <span className="flex items-center hover:text-brand-primary cursor-pointer"><MessageCircle className="w-4 h-4 mr-2" /> <span>{post.replyCount !== undefined ? post.replyCount : 18}</span></span>
                    <a href={post.externalUrl} target="_blank" rel="noopener noreferrer" className="hover:text-text-primary font-medium ml-auto transition-colors flex items-center gap-1 bg-surface-base px-2 py-1 rounded border border-surface-border">
                      View on Bluesky ↗
                    </a>
                  </div>
                </article>
              </TiltCard>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
