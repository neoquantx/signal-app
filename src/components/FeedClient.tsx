"use client"
import { useEffect, useState, useCallback } from "react"
import PostCard from "./PostCard"
import { Post } from "@/types"
import type { MyFeedPost } from "@/app/api/bluesky-oauth/my-feed/route"

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
    <div className="relative space-y-6">
      {showNewPostsButton && (
        <button
          onClick={handleRefresh}
          className="fixed top-24 left-1/2 -translate-x-1/2 bg-accent-green text-white px-5 py-2.5 rounded-full shadow-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-opacity-90 transition-all duration-200 z-40 animate-bounce cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          New posts available
        </button>
      )}

      {/* Header and Tabs */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm mb-2">Your Feed</h1>
        <p className="text-white/80 text-sm font-medium">Ranked by trust · human-verified</p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setActiveTab("foryou")}
            className={`text-sm px-6 py-2 rounded-full transition-all cursor-pointer ${
              activeTab === "foryou"
                ? "font-semibold bg-accent-green text-[#12160d] shadow-lg border border-white/20"
                : "font-medium glass-panel text-accent-green border border-white/30 hover:bg-white/10"
            }`}
          >
            For you
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`text-sm px-6 py-2 rounded-full transition-all cursor-pointer ${
              activeTab === "following"
                ? "font-semibold bg-accent-green text-[#12160d] shadow-lg border border-white/20"
                : "font-medium glass-panel text-accent-green border border-white/30 hover:bg-white/10"
            }`}
          >
            Following
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-panel rounded-2xl p-6 animate-pulse h-40" />
          ))}
        </div>
      ) : activeTab === "following" && !followingStatus.connected ? (
        <div className="glass-panel rounded-[32px] p-10 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-accent-green/10 flex items-center justify-center text-3xl">🦋</div>
          <div>
            <p className="text-lg font-medium text-white mb-2">Connect your Bluesky account</p>
            <p className="text-sm text-on-surface-variant max-w-sm mx-auto">
              See your real feed from people you follow, scored by Signal for authenticity — no hidden algorithm.
            </p>
          </div>
          <a href="/connect" className="mt-2 text-sm px-6 py-3 rounded-full bg-accent-green text-[#12160d] font-semibold hover:bg-opacity-95 transition-all shadow-md cursor-pointer">
            Connect Bluesky →
          </a>
        </div>
      ) : activeTab === "following" && followingError && currentPosts.length === 0 ? (
        <div className="glass-panel rounded-[32px] p-10 text-center">
          <p className="text-sm text-on-surface-variant mb-4">{followingError}</p>
          <a href="/connect" className="text-sm text-accent-green font-medium hover:underline cursor-pointer">
            Reconnect your Bluesky account →
          </a>
        </div>
      ) : currentPosts.length === 0 ? (
        <div className="glass-panel rounded-[32px] p-20 text-center">
          <p className="text-lg font-medium text-white mb-2">
            {activeTab === "foryou" ? "No posts yet" : "No timeline posts found"}
          </p>
          <p className="text-sm text-on-surface-variant">
            {activeTab === "foryou" 
              ? "Be the first to post something trustworthy" 
              : "Follow some accounts on Bluesky to see your feed here."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {currentPosts.map((post, i) => (
            <div 
              key={post.id} 
              className="animate-fade-in" 
              style={{ animationDelay: `${Math.min(i * 50, 300)}ms`, animationFillMode: 'both' }}
            >
              <PostCard post={post} currentUserId={currentUserId} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
