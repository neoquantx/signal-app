"use client"
import { useState } from "react"
import { Post } from "@/types"

interface Props {
  post: Post
  currentUserId?: string
}

export default function PostCard({ post, currentUserId }: Props) {
  const [trusted, setTrusted] = useState(false)
  const [trustCount, setTrustCount] = useState(post.trustCount ?? 0)

  const scoreColor = post.humanScore >= 90 ? "text-green-600 bg-green-50 border-green-200"
    : post.humanScore >= 70 ? "text-yellow-600 bg-yellow-50 border-yellow-200"
    : "text-red-500 bg-red-50 border-red-200"

  const dotColor = post.humanScore >= 90 ? "bg-green-500"
    : post.humanScore >= 70 ? "bg-yellow-500" : "bg-red-500"

  async function handleTrust() {
    if (trusted || post.authorId === currentUserId) return
    setTrusted(true)
    setTrustCount(p => p + 1)
    await fetch("/api/trust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trusteeId: post.authorId, topicId: post.topicId }),
    })
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const h = Math.floor(diff / 3600000)
    const m = Math.floor(diff / 60000)
    if (h > 0) return `${h}h ago`
    if (m > 0) return `${m}m ago`
    return "just now"
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-3">
      <div className="flex items-start gap-3">
        {post.authorImage && (
          <img src={post.authorImage} className="w-9 h-9 rounded-full flex-shrink-0" alt="" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div>
              <span className="text-sm font-medium text-gray-900">{post.authorName}</span>
              <span className="text-xs text-gray-400 ml-2">{timeAgo(post.createdAt)}</span>
            </div>
            <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${scoreColor}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
              {post.humanScore}% human
            </div>
          </div>

          <span className="inline-block text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mb-2">
            {post.topicName}
          </span>

          <p className="text-sm text-gray-800 leading-relaxed mb-3">{post.content}</p>

          <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
              <span>↳</span> Why you see this
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{post.authorName}</span>
              <span className="text-xs text-gray-400">→</span>
              <span className="text-xs bg-blue-50 border border-blue-200 text-blue-600 px-2 py-0.5 rounded-full">You</span>
              <span className="text-xs text-gray-400 ml-2">· 100% topic match · {post.topicName}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTrust}
              disabled={trusted || post.authorId === currentUserId}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                trusted
                  ? "bg-blue-50 border-blue-200 text-blue-600"
                  : "border-gray-200 text-gray-500 hover:border-blue-200 hover:text-blue-600"
              } disabled:opacity-40`}
            >
              {trusted ? "✓ Trusted" : `Trust on ${post.topicName.split(" ")[0]}`}
              {trustCount > 0 && <span className="text-gray-400">· {trustCount}</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
