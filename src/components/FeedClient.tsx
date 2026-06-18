"use client"
import { useEffect, useState } from "react"
import PostCard from "./PostCard"
import { Post } from "@/types"

export default function FeedClient({ currentUserId }: { currentUserId: string }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/users/sync", { method: "POST" }).catch(() => {})
    fetch("/api/posts")
      .then(r => r.json())
      .then(d => { setPosts(d.posts ?? []); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
          <div className="flex gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-100 rounded w-1/4" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  if (posts.length === 0) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
      <p className="text-sm text-gray-500 mb-1">No posts yet</p>
      <p className="text-xs text-gray-400">Be the first to post something trustworthy</p>
    </div>
  )

  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} currentUserId={currentUserId} />
      ))}
    </div>
  )
}
