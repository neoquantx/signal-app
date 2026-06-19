"use client"
import { useEffect, useState } from "react"
import PostCard from "./PostCard"
import { Post } from "@/types"

export default function FeedClient({ currentUserId }: { currentUserId: string }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"foryou" | "following">("foryou")
  const [showNewPostsButton, setShowNewPostsButton] = useState(false)

  useEffect(() => {
    fetch("/api/users/sync", { method: "POST" }).catch(() => {})
    fetchPosts()
  }, [])

  useEffect(() => {
    // Show floating button after 30 seconds
    const timer = setTimeout(() => {
      setShowNewPostsButton(true)
    }, 30000)

    return () => clearTimeout(timer)
  }, [posts]) // Reset if posts refetched

  function fetchPosts() {
    fetch("/api/posts")
      .then(r => r.json())
      .then(d => {
        setPosts(d.posts ?? [])
        setLoading(false)
      })
  }

  function handleRefresh() {
    setShowNewPostsButton(false)
    setLoading(true)
    fetchPosts()
  }

  if (loading) return (
    <div className="space-y-4">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-2 animate-pulse">
        <div className="h-7 bg-slate-200 rounded-lg w-28" />
      </div>
      
      {/* Tab Switcher Skeleton */}
      <div className="border-b border-[#E2E8F0] pb-3 flex justify-between items-center animate-pulse">
        <div className="flex gap-6">
          <div className="h-5 bg-slate-200 rounded-md w-16" />
          <div className="h-5 bg-slate-200 rounded-md w-16" />
        </div>
        <div className="h-3.5 bg-slate-200 rounded-md w-40" />
      </div>

      {/* Feed List Skeleton */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] divide-y divide-[#F1F5F9] overflow-hidden shadow-sm shadow-slate-100/40">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-5 animate-pulse flex items-start gap-4">
            {/* Avatar skeleton */}
            <div className="w-10 h-10 bg-slate-200 rounded-full flex-shrink-0" />
            
            {/* Content lines skeleton */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-4 bg-slate-200 rounded w-1/4" />
                <div className="h-3 bg-slate-200 rounded w-12" />
                <div className="h-5 bg-slate-200 rounded-full w-24" />
              </div>
              <div className="h-5 bg-slate-200 rounded-full w-20" />
              <div className="space-y-2">
                <div className="h-3.5 bg-slate-200 rounded w-full" />
                <div className="h-3.5 bg-slate-200 rounded w-4/5" />
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-24" />
                <div className="h-3.5 bg-slate-200 rounded w-3/5" />
              </div>
              <div className="h-8 bg-slate-200 rounded-full w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="relative">
      {/* Floating "New posts available" Button */}
      {showNewPostsButton && (
        <button
          onClick={handleRefresh}
          className="fixed top-24 left-1/2 -translate-x-1/2 bg-[#2563EB] text-white px-5 py-2.5 rounded-full shadow-lg shadow-blue-500/25 text-xs font-semibold flex items-center gap-1.5 hover:bg-[#1D4ED8] hover:scale-105 active:scale-95 transition-all duration-200 z-40 animate-bounce cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          New posts available
        </button>
      )}

      {/* Header title */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">Your feed</h1>
      </div>

      {/* Tab Switcher */}
      <div className="border-b border-[#E2E8F0] mb-5 flex items-center justify-between">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("foryou")}
            className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
              activeTab === "foryou" ? "text-[#2563EB]" : "text-[#475569] hover:text-[#0F172A]"
            }`}
          >
            For you
            {activeTab === "foryou" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full animate-scaleIn" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
              activeTab === "following" ? "text-[#2563EB]" : "text-[#475569] hover:text-[#0F172A]"
            }`}
          >
            Following
            {activeTab === "following" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full animate-scaleIn" />
            )}
          </button>
        </div>
        <span className="text-xs text-[#94A3B8] pb-3">Ranked by trust · human-verified</span>
      </div>

      {/* Unified Feed Container with Dividers */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-12 text-center shadow-sm shadow-slate-100/40 animate-scaleIn">
          <p className="text-sm font-medium text-[#475569] mb-1">No posts yet</p>
          <p className="text-xs text-[#94A3B8]">Be the first to post something trustworthy</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E2E8F0] divide-y divide-[#F1F5F9] overflow-hidden shadow-sm shadow-slate-100/40">
          {posts.map(post => (
            <PostCard key={post.id} post={post} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  )
}
