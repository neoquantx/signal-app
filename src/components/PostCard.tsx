"use client"
import { useState, useEffect } from "react"
import { Post } from "@/types"
import TiltCard from "@/components/TiltCard"
import { Heart, MessageCircle, Repeat, BadgeCheck } from "lucide-react"

interface Props {
  post: Post
  currentUserId?: string
}

export default function PostCard({ post, currentUserId }: Props) {
  const [trusted, setTrusted] = useState(false)
  const [trustCount, setTrustCount] = useState(post.trustCount ?? 0)
  const [timeAgoStr, setTimeAgoStr] = useState("")

  const isHigh = post.humanScore >= 90
  const isMid = post.humanScore >= 70 && post.humanScore < 90

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

  useEffect(() => {
    const diff = Date.now() - new Date(post.createdAt).getTime()
    const h = Math.floor(diff / 3600000)
    const m = Math.floor(diff / 60000)
    let val = "just now"
    if (h > 0) {
      val = `${h}h ago`
    } else if (m > 0) {
      val = `${m}m ago`
    }
    const timer = setTimeout(() => {
      setTimeAgoStr(val)
    }, 0)
    return () => clearTimeout(timer)
  }, [post.createdAt])

  const scoreColor = isHigh
    ? "text-green-400 bg-green-500/10 border-green-500/20 border"
    : isMid
    ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20 border"
    : "text-red-400 bg-red-500/10 border-red-500/20 border"

  return (
    <TiltCard maxTilt={3}>
      <article className="glass-panel rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
        {post.isRepost && post.repostedBy && (
          <p className="text-[10px] font-bold text-white/50 mb-3 px-1 uppercase tracking-widest flex items-center gap-1.5">
            <span>🔁</span> Reposted by @{post.repostedBy}
          </p>
        )}

        <div className="flex gap-3 items-center mb-3">
          {post.authorImage ? (
            <img src={post.authorImage} className="w-10 h-10 rounded-full object-cover border border-white/10" alt={post.authorName} />
          ) : (
            <div className="w-10 h-10 rounded-full bg-accent-green/10 text-accent-green flex items-center justify-center font-bold text-sm">
              {post.authorName.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-accent-green text-sm hover:underline cursor-pointer">{post.authorName}</h3>
              {post.authorHandle && (
                <span className="text-xs text-on-surface-variant/80">@{post.authorHandle}</span>
              )}
              {isHigh && <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />}
            </div>
            <p className="text-xs text-on-surface-variant">{timeAgoStr} • {post.topicName}</p>
          </div>
          
          <div className={`ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full ${scoreColor}`}>
            {post.humanScore}% AUTHENTIC
          </div>
        </div>

        <p className="text-on-surface leading-relaxed text-[15px] mb-4 whitespace-pre-wrap">
          {post.content}
        </p>

        <div className="bg-accent-green/5 p-4 rounded-xl border border-accent-green/10 mb-4">
          <p className="text-[10px] font-bold text-accent-green uppercase tracking-widest mb-1">↳ Why you see this</p>
          <div className="flex items-center gap-2 flex-wrap text-xs text-on-surface-variant">
            <span className="font-medium text-white/90">{post.authorName}</span>
            <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-semibold text-accent-green">You</span>
            <span>· 100% topic match · #{post.topicName}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-on-surface-variant pt-3 border-t border-white/5">
          <div className="flex items-center space-x-6">
            <button className="flex items-center hover:text-accent-green transition-colors font-medium text-sm cursor-pointer">
              <Heart className="w-4 h-4 mr-2" />
              <span>{post.likeCount !== undefined ? post.likeCount : 124}</span>
            </button>
            <button className="flex items-center hover:text-accent-green transition-colors font-medium text-sm cursor-pointer">
              <MessageCircle className="w-4 h-4 mr-2" />
              <span>{post.replyCount !== undefined ? post.replyCount : 18}</span>
            </button>
            <button className="flex items-center hover:text-accent-green transition-colors font-medium text-sm cursor-pointer">
              <Repeat className="w-4 h-4 mr-2" />
              <span>{post.repostCount !== undefined ? post.repostCount : 5}</span>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            {post.externalUrl && (
              <a 
                href={post.externalUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1 cursor-pointer"
              >
                View on Bluesky ↗
              </a>
            )}
            
            <button 
              onClick={handleTrust}
              disabled={trusted || post.authorId === currentUserId}
              className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                trusted
                  ? "bg-accent-green/20 text-accent-green"
                  : "bg-white/5 hover:bg-accent-green/10 hover:text-accent-green border border-white/10"
              }`}
            >
              {trusted ? "✓ Trusted" : "Trust"}
              {trustCount > 0 && <span>· {trustCount}</span>}
            </button>
          </div>
        </div>
      </article>
    </TiltCard>
  )
}
