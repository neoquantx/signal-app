"use client"
import { useEffect, useState, useCallback } from "react"
import PostCard from "./PostCard"
import { Post } from "@/types"
import type { MyFeedPost } from "@/app/api/bluesky-oauth/my-feed/route"
import { Loader2 } from "lucide-react"

export default function FeedClient({ currentUserId }: { currentUserId: string }) {
  const [foryouPosts, setForyouPosts] = useState<Post[]>([])
  const [followingPosts, setFollowingPosts] = useState<Post[]>([])
  const [foryouLoading, setForyouLoading] = useState(true)
  const [followingLoading, setFollowingLoading] = useState(false)
  const [followingStatus, setFollowingStatus] = useState<{ checked: boolean; connected: boolean; handle?: string }>({
    checked: false,
    connected: false,
  })
  const [followingError, setFollowingError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"foryou" | "following">("foryou")
  const [showNewPostsButton, setShowNewPostsButton] = useState(false)

  const fetchForyouPosts = useCallback(() => {
    setForyouLoading(true)
    fetch("/api/posts")
      .then(r => r.json())
      .then(d => {
        setForyouPosts(d.posts ?? [])
        setForyouLoading(false)
      })
      .catch(() => setForyouLoading(false))
  }, [])

  const fetchFollowingPosts = useCallback(() => {
    setFollowingLoading(true)
    setFollowingError(null)
    fetch("/api/bluesky-oauth/status")
      .then(r => r.json())
      .then((d: { connected: boolean; handle?: string }) => {
        setFollowingStatus({ checked: true, connected: d.connected, handle: d.handle })
        if (!d.connected) {
          setFollowingLoading(false)
          return
        }
        return fetch("/api/bluesky-oauth/my-feed")
          .then(r => r.json())
          .then((feed: { posts: MyFeedPost[]; connected: boolean; error?: string }) => {
            if (feed.error) {
              setFollowingError(feed.error)
            }
            const mapped = (feed.posts ?? []).map((p: MyFeedPost) => ({
              id: p.id,
              authorId: `bluesky:${p.authorHandle}`,
              authorName: p.authorName,
              authorImage: p.authorImage,
              content: p.content,
              topicId: "bluesky",
              topicName: "Bluesky",
              humanScore: p.humanScore,
              trustCount: p.likeCount ?? 0,
              createdAt: p.createdAt,
              authorHandle: p.authorHandle,
              externalUrl: p.externalUrl,
              isRepost: p.isRepost,
              repostedBy: p.repostedBy,
              likeCount: p.likeCount,
              repostCount: p.repostCount,
              replyCount: p.replyCount,
            }))
            setFollowingPosts(mapped)
            setFollowingLoading(false)
          })
      })
      .catch(() => {
        setFollowingStatus({ checked: true, connected: false })
        setFollowingLoading(false)
        setFollowingError("Failed to fetch timeline status.")
      })
  }, [])

  useEffect(() => {
    fetch("/api/users/sync", { method: "POST" }).catch(() => {})
    const timer = setTimeout(() => {
      fetchForyouPosts()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchForyouPosts])

  useEffect(() => {
    if (activeTab === "following") {
      const timer = setTimeout(() => {
        fetchFollowingPosts()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [activeTab, fetchFollowingPosts])

  const postsDependency = activeTab === "foryou" ? foryouPosts : followingPosts

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNewPostsButton(true)
    }, 30000)

    return () => clearTimeout(timer)
  }, [postsDependency])

  function handleRefresh() {
    setShowNewPostsButton(false)
    if (activeTab === "foryou") {
      fetchForyouPosts()
    } else {
      fetchFollowingPosts()
    }
  }

  const isLoading = activeTab === "foryou" ? foryouLoading : followingLoading
  const currentPosts = activeTab === "foryou" ? foryouPosts : followingPosts

  return (
    <div className="relative space-y-8 pt-6 pb-20 max-w-2xl mx-auto w-full">
      {showNewPostsButton && (
        <button
          onClick={handleRefresh}
          className="fixed top-24 left-1/2 -translate-x-1/2 bg-surface-elevated text-white border border-brand-primary px-6 py-2.5 rounded-full shadow-[0_4px_20px_rgba(138,43,226,0.4)] text-sm font-semibold flex items-center gap-2 hover:bg-surface-glass transition-all duration-300 z-40 animate-bounce cursor-pointer group"
        >
          <svg className="w-4 h-4 text-brand-secondary group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <span className="gradient-text">New posts available</span>
        </button>
      )}

      {/* Header and Tabs */}
      <div className="mb-10 text-center fade-in-up px-4">
        <h1 className="text-4xl md:text-5xl font-serif text-text-primary tracking-tight mb-3">Your Feed</h1>
        <p className="text-text-secondary text-sm md:text-base font-medium">Ranked by <span className="font-semibold text-text-primary">trust</span> · human-verified</p>
        
        <div className="flex justify-center mt-8">
          <div className="flex gap-1 p-1.5 rounded-full bg-surface-elevated border border-surface-border shadow-sm w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("foryou")}
              className={`flex-1 sm:flex-none text-sm px-6 sm:px-8 py-2.5 rounded-full transition-all duration-300 cursor-pointer relative z-10 font-medium ${
                activeTab === "foryou"
                  ? "bg-text-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-glass-hover"
              }`}
            >
              For you
            </button>
            <button
              onClick={() => setActiveTab("following")}
              className={`flex-1 sm:flex-none text-sm px-6 sm:px-8 py-2.5 rounded-full transition-all duration-300 cursor-pointer relative z-10 font-medium ${
                activeTab === "following"
                  ? "bg-text-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-glass-hover"
              }`}
            >
              Following
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6 px-4 sm:px-0">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-panel p-6 h-48 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-surface-border to-transparent opacity-20 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-surface-border animate-pulse shrink-0" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 bg-surface-border rounded w-1/3 animate-pulse" />
                  <div className="h-3 bg-surface-border rounded w-1/4 animate-pulse" />
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="h-3 bg-surface-border rounded w-full animate-pulse" />
                <div className="h-3 bg-surface-border rounded w-5/6 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === "following" && !followingStatus.connected ? (
        <div className="mx-4 sm:mx-0 glass-panel p-8 sm:p-12 text-center flex flex-col items-center gap-5 fade-in-up">
          <div className="w-20 h-20 rounded-full bg-brand-primary/10 flex items-center justify-center text-4xl shrink-0">
            🦋
          </div>
          <div className="relative z-10">
            <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">Connect your Bluesky</h3>
            <p className="text-sm sm:text-base text-text-secondary max-w-md mx-auto">
              See your real feed from people you follow, scored by Signal for authenticity — no hidden algorithm.
            </p>
          </div>
          <a href="/connect" className="mt-4 btn-primary text-sm px-8 py-3.5 rounded-full inline-block shadow-sm">
            Connect Account →
          </a>
        </div>
      ) : activeTab === "following" && followingError && currentPosts.length === 0 ? (
        <div className="mx-4 sm:mx-0 glass-panel p-8 sm:p-12 text-center fade-in-up border border-status-error/30 bg-status-error/5">
          <div className="text-status-error text-3xl mb-4">⚠️</div>
          <p className="text-sm sm:text-base text-text-primary mb-6 font-medium">{followingError}</p>
          <a href="/connect" className="text-xs sm:text-sm text-brand-secondary font-semibold hover:text-brand-primary transition-colors cursor-pointer border border-brand-secondary/30 bg-brand-secondary/10 px-6 py-2.5 rounded-full block sm:inline-block">
            Reconnect Bluesky Account →
          </a>
        </div>
      ) : currentPosts.length === 0 ? (
        <div className="mx-4 sm:mx-0 glass-panel p-10 sm:p-16 text-center fade-in-up">
          <div className="text-5xl mb-6 opacity-60">🍃</div>
          <p className="text-xl sm:text-2xl font-bold text-text-primary mb-3">
            {activeTab === "foryou" ? "Nothing here yet" : "No timeline posts"}
          </p>
          <p className="text-base text-text-secondary">
            {activeTab === "foryou" 
              ? "Be the first to post something trustworthy." 
              : "Follow some accounts on Bluesky to see your feed here."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {currentPosts.map((post, i) => (
            <div 
              key={post.id} 
              className="fade-in-up" 
              style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
            >
              <PostCard post={post} currentUserId={currentUserId} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
