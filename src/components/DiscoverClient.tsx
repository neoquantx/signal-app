"use client"
import { useEffect, useState } from "react"
import { getTopicsByCategory, type Topic } from "@/lib/topics"
import TiltCard from "@/components/TiltCard"

// ---------------------------------------------------------------------------
// Shared post shape used by both tabs
// ---------------------------------------------------------------------------
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

// Shape returned by /api/bluesky-oauth/my-feed
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

// ---------------------------------------------------------------------------
// Score helpers (shared) — semantic status colors intentionally preserved
// ---------------------------------------------------------------------------
function scoreColorClass(score: number) {
  return score >= 90
    ? "text-green-600 bg-green-50 border-green-200"
    : score >= 70
    ? "text-yellow-600 bg-yellow-50 border-yellow-200"
    : "text-red-500 bg-red-50 border-red-200"
}

function dotColorClass(score: number) {
  return score >= 90 ? "bg-green-500" : score >= 70 ? "bg-yellow-500" : "bg-red-500"
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function DiscoverClient() {
  const grouped = getTopicsByCategory()
  const categories = Object.keys(grouped)

  // ---- Tab state ----
  const [activeTab, setActiveTab] = useState<ActiveTab>("topic")

  // ---- By-Topic state (unchanged) ----
  const [activeTopic, setActiveTopic] = useState("ai")
  const [posts, setPosts] = useState<DiscoverPost[]>([])
  const [topicLoading, setTopicLoading] = useState(true)
  const [trustedHandles, setTrustedHandles] = useState<Record<string, boolean>>({})

  // ---- Your Network state ----
  const [networkStatus, setNetworkStatus] = useState<{
    checked: boolean
    connected: boolean
    handle?: string
  }>({ checked: false, connected: false })
  const [networkPosts, setNetworkPosts] = useState<MyFeedPost[]>([])
  const [networkLoading, setNetworkLoading] = useState(false)
  const [networkError, setNetworkError] = useState<string | null>(null)

  // ---- By-Topic: fetch on topic change ----
  useEffect(() => {
    if (activeTab !== "topic") return
    setTopicLoading(true)
    fetch(`/api/discover?topic=${activeTopic}`)
      .then(r => r.json())
      .then(d => { setPosts(d.posts ?? []); setTopicLoading(false) })
      .catch(() => setTopicLoading(false))
  }, [activeTopic, activeTab])

  // ---- Your Network: check connection + fetch feed on tab switch ----
  useEffect(() => {
    if (activeTab !== "network") return

    // If we've already loaded the status, don't re-check
    if (networkStatus.checked) return

    // 1. Check whether Bluesky is connected
    fetch("/api/bluesky-oauth/status")
      .then(r => r.json())
      .then((d: { connected: boolean; handle?: string }) => {
        setNetworkStatus({ checked: true, connected: d.connected, handle: d.handle })

        if (!d.connected) return // Show the connect prompt — no feed to fetch

        // 2. If connected, fetch the real timeline
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

  // ---- Trust handler (By-Topic only) ----
  async function handleTrust(handle: string, topicId: string) {
    const key = `${handle}-${topicId}`
    setTrustedHandles(prev => ({ ...prev, [key]: true }))
    await fetch("/api/trust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trusteeId: `bluesky:${handle}`, topicId }),
    })
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div>
      {/* ------------------------------------------------------------------ */}
      {/* Tab toggle                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("topic")}
          className={`text-sm px-4 py-2 rounded-full font-medium transition-all ${
            activeTab === "topic"
              ? "bg-accent text-white shadow-sm"
              : "bg-surface text-text-secondary border border-border-app hover:border-accent-border hover:text-accent"
          }`}
        >
          By Topic
        </button>
        <button
          onClick={() => setActiveTab("network")}
          className={`text-sm px-4 py-2 rounded-full font-medium transition-all ${
            activeTab === "network"
              ? "bg-accent text-white shadow-sm"
              : "bg-surface text-text-secondary border border-border-app hover:border-accent-border hover:text-accent"
          }`}
        >
          Your Network
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* BY TOPIC TAB                                                        */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "topic" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar — fixed column on desktop, horizontal chip row on mobile */}
          <div className="lg:col-span-1">
            {/* Mobile: horizontal scrollable chips */}
            <div className="lg:hidden overflow-x-auto pb-3 -mx-4 px-4 flex gap-2 scrollbar-none">
              {Object.values(grouped).flat().map((t: Topic) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTopic(t.id)}
                  className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors flex-shrink-0 ${
                    activeTopic === t.id
                      ? "bg-accent text-white font-medium"
                      : "bg-surface text-text-secondary border border-border-app hover:border-accent-border hover:text-accent"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            {/* Desktop: vertical sidebar */}
            <div className="hidden lg:block bg-surface rounded-2xl border border-border-app p-4 sticky top-20 max-h-[75vh] overflow-y-auto">
              <p className="text-xs font-medium text-text-tertiary mb-3 uppercase tracking-wide">Topics</p>
              {categories.map(cat => (
                <div key={cat} className="mb-4">
                  <p className="text-xs font-medium text-text-secondary mb-1.5">{cat}</p>
                  <div className="flex flex-col gap-1">
                    {grouped[cat].map((t: Topic) => (
                      <button
                        key={t.id}
                        onClick={() => setActiveTopic(t.id)}
                        className={`text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                          activeTopic === t.id
                            ? "bg-accent-soft text-accent font-medium"
                            : "text-text-secondary hover:bg-surface-secondary"
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Post list */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h2 className="text-sm font-medium text-text-primary">Live from Bluesky · scored by Signal</h2>
              <span className="text-xs text-text-tertiary hidden sm:block">Real posts, real authenticity check</span>
            </div>

            {topicLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-surface rounded-2xl border border-border-app p-5 animate-pulse h-28" />
                ))}
              </div>
            )}

            {!topicLoading && posts.length === 0 && (
              <div className="bg-surface rounded-2xl border border-border-app p-10 text-center">
                <p className="text-sm text-text-secondary">No posts found for this topic right now</p>
              </div>
            )}

            {!topicLoading && posts.map((post, i) => {
              const key = `${post.authorHandle}-${post.topicId}`
              return (
                <div key={post.id} className="animate-fade-in" style={{ animationDelay: `${Math.min(i * 50, 300)}ms`, animationFillMode: 'both' }}>
                <TiltCard maxTilt={7}>
                  <div className="bg-surface rounded-3xl p-6 mb-4 hover:bg-surface-secondary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                    <div className="flex items-start gap-3">
                      {post.authorImage ? (
                        <img src={post.authorImage} className="w-9 h-9 rounded-full flex-shrink-0" alt="" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-surface-secondary flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-text-primary">{post.authorName}</span>
                            <span className="text-xs text-text-tertiary ml-2">@{post.authorHandle}</span>
                            {/* "via Bluesky" badge uses accent-soft */}
                            <span className="text-xs text-accent ml-2 bg-accent-soft px-1.5 py-0.5 rounded-full">via Bluesky</span>
                          </div>
                          {/* Score badge — semantic status color preserved */}
                          <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border flex-shrink-0 ${scoreColorClass(post.humanScore)}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${dotColorClass(post.humanScore)}`} />
                            {post.humanScore}% human
                          </div>
                        </div>

                        {/* Topic pill */}
                        <span className="inline-block text-xs text-accent bg-accent-soft px-2 py-0.5 rounded-full mb-2">
                          {post.topicName}
                        </span>

                        <p className="text-sm text-text-primary leading-relaxed mb-3">{post.content}</p>

                        <div className="bg-surface-secondary rounded-xl p-3.5 mb-3 border-l-2 border-accent">
                          <p className="text-xs text-text-tertiary mb-1.5">↳ Why you see this</p>
                          <p className="text-xs text-text-secondary">
                            Imported from Bluesky · matched topic <b>{post.topicName}</b> · authenticity score computed from content + engagement pattern (no behavioral signal available for external posts)
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleTrust(post.authorHandle, post.topicId)}
                            disabled={trustedHandles[key]}
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                              trustedHandles[key]
                                ? "bg-accent-soft border-accent-border text-accent"
                                : "border-border-app text-text-secondary hover:border-accent-border hover:text-accent"
                            }`}
                          >
                            {trustedHandles[key] ? "✓ Trusted" : `Trust on ${post.topicName.split(" ")[0]}`}
                          </button>
                          <a href={post.externalUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-text-tertiary hover:text-text-secondary">
                            View on Bluesky ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </TiltCard>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* YOUR NETWORK TAB — full-width, no sidebar                          */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "network" && (
        <div className="max-w-2xl">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h2 className="text-sm font-medium text-text-primary">Your Bluesky Network · scored by Signal</h2>
            <span className="text-xs text-text-tertiary">People you follow, authenticity checked</span>
          </div>

          {/* ---- Not yet checked (brief flicker guard) ---- */}
          {!networkStatus.checked && !networkLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-surface rounded-2xl border border-border-app p-5 animate-pulse h-28" />
              ))}
            </div>
          )}

          {/* ---- Not connected — show prompt ---- */}
          {networkStatus.checked && !networkStatus.connected && (
            <div className="bg-surface rounded-2xl border border-border-app p-10 text-center flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent-soft flex items-center justify-center text-2xl">🦋</div>
              <div>
                <p className="text-sm font-medium text-text-primary mb-1">
                  Connect your Bluesky account
                </p>
                <p className="text-xs text-text-secondary max-w-xs">
                  See your real feed from people you follow, scored by Signal for authenticity — no hidden algorithm.
                </p>
              </div>
              <a
                href="/connect"
                className="text-sm px-5 py-2.5 rounded-full bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
              >
                Connect Bluesky →
              </a>
            </div>
          )}

          {/* ---- Loading ---- */}
          {networkStatus.connected && networkLoading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-surface rounded-2xl border border-border-app p-5 animate-pulse h-28" />
              ))}
            </div>
          )}

          {/* ---- Error state ---- */}
          {networkStatus.connected && !networkLoading && networkError && networkPosts.length === 0 && (
            <div className="bg-surface rounded-2xl border border-border-app p-8 text-center">
              <p className="text-sm text-text-secondary mb-3">{networkError}</p>
              <a href="/connect" className="text-xs text-accent hover:underline">
                Reconnect your Bluesky account →
              </a>
            </div>
          )}

          {/* ---- Empty state (connected, no error, 0 posts) ---- */}
          {networkStatus.connected && !networkLoading && !networkError && networkPosts.length === 0 && (
            <div className="bg-surface rounded-2xl border border-border-app p-10 text-center">
              <p className="text-sm text-text-secondary">
                No posts found. Follow some accounts on Bluesky to see your feed here.
              </p>
            </div>
          )}

          {/* ---- Feed posts ---- */}
          {networkStatus.connected && !networkLoading && networkPosts.map((post, i) => (
            <div key={post.id} className="animate-fade-in" style={{ animationDelay: `${Math.min(i * 50, 300)}ms`, animationFillMode: 'both' }}>
            <TiltCard maxTilt={7}>
              <div className="bg-surface rounded-3xl p-6 mb-4 hover:bg-surface-secondary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                {/* Repost indicator */}
                {post.isRepost && post.repostedBy && (
                  <p className="text-xs text-text-tertiary mb-2 pl-0.5">
                    🔁 Reposted by @{post.repostedBy}
                  </p>
                )}

                <div className="flex items-start gap-3">
                  {post.authorImage ? (
                    <img src={post.authorImage} className="w-9 h-9 rounded-full flex-shrink-0" alt="" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-surface-secondary flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-text-primary">{post.authorName}</span>
                        <span className="text-xs text-text-tertiary ml-2">@{post.authorHandle}</span>
                        <span className="text-xs text-accent ml-2 bg-accent-soft px-1.5 py-0.5 rounded-full">via Bluesky</span>
                      </div>
                      {/* Score badge — semantic status color preserved */}
                      <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border flex-shrink-0 ${scoreColorClass(post.humanScore)}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${dotColorClass(post.humanScore)}`} />
                        {post.humanScore}% human
                      </div>
                    </div>

                    <p className="text-sm text-text-primary leading-relaxed mb-3">{post.content}</p>

                    {/* Network-specific provenance box */}
                    <div className="bg-surface-secondary rounded-xl p-3.5 mb-3 border-l-2 border-accent">
                      <p className="text-xs text-text-tertiary mb-1.5">↳ Why you see this</p>
                      <p className="text-xs text-text-secondary">
                        From your Bluesky network — you follow{" "}
                        <b>@{post.authorHandle}</b>
                        {post.isRepost ? " · shown as a repost" : ""} · authenticity score computed from content + engagement pattern
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-text-tertiary flex-wrap">
                      <span>♥ {post.likeCount}</span>
                      <span>🔁 {post.repostCount}</span>
                      <span>💬 {post.replyCount}</span>
                      <a
                        href={post.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-text-secondary ml-auto"
                      >
                        View on Bluesky ↗
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
