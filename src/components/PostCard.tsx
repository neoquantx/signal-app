"use client"
import { useState, useEffect } from "react"
import { Post } from "@/types"
import TiltCard from "@/components/TiltCard"
import { Heart, MessageCircle, Repeat, BadgeCheck, Zap } from "lucide-react"

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
    ? "text-status-success bg-status-success/10 border-status-success/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
    : isMid
    ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20 shadow-[0_0_10px_rgba(250,204,21,0.2)]"
    : "text-status-error bg-status-error/10 border-status-error/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]"

  return (
    <TiltCard maxTilt={2}>
      <article className="glass-panel rounded-[2rem] p-6 group transition-all duration-300 relative overflow-hidden">
        {/* Subtle glow effect behind card */}
        <div className="absolute -inset-1 bg-gradient-to-br from-brand-primary/20 via-transparent to-brand-accent/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

        {post.isRepost && post.repostedBy && (
          <p className="text-[10px] font-bold text-text-tertiary mb-4 px-2 py-1 rounded-full bg-surface-elevated w-max uppercase tracking-widest flex items-center gap-1.5 border border-surface-border shadow-inner">
            <Repeat className="w-3 h-3 text-brand-secondary" /> Reposted by @{post.repostedBy}
          </p>
        )}

        <div className="flex gap-4 items-center mb-5">
          <div className="relative">
            {post.authorImage ? (
              <img src={post.authorImage} className="w-12 h-12 rounded-full object-cover border-2 border-surface-border shadow-md" alt={post.authorName} />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent text-white flex items-center justify-center font-bold text-lg shadow-md">
                {post.authorName.charAt(0)}
              </div>
            )}
            {isHigh && (
              <div className="absolute -bottom-1 -right-1 bg-surface-base rounded-full p-0.5">
                <BadgeCheck className="w-4 h-4 text-brand-secondary" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-white text-base hover:text-brand-secondary transition-colors cursor-pointer">{post.authorName}</h3>
              {post.authorHandle && (
                <span className="text-sm text-text-secondary">@{post.authorHandle}</span>
              )}
            </div>
            <p className="text-xs text-text-tertiary mt-0.5">{timeAgoStr} • <span className="text-brand-secondary/80 hover:text-brand-secondary cursor-pointer transition-colors">{post.topicName}</span></p>
          </div>
          
          <div className={`text-[10px] font-bold px-3 py-1.5 rounded-full border ${scoreColor} flex items-center gap-1`}>
            <Zap className="w-3 h-3" /> {post.humanScore}% AUTHENTIC
          </div>
        </div>

        <p className="text-white/90 leading-relaxed text-base mb-6 whitespace-pre-wrap font-light tracking-wide">
          {post.content}
        </p>

        <div className="bg-surface-elevated/50 p-4 rounded-2xl border border-surface-border mb-5 backdrop-blur-sm shadow-inner">
          <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <span className="text-brand-primary">↳</span> Why you see this
          </p>
          <div className="flex items-center gap-2 flex-wrap text-xs text-text-secondary font-light">
            <span className="font-medium text-white">{post.authorName}</span>
            <svg className="w-3 h-3 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-medium gradient-text">You</span>
            <span className="opacity-75">· 100% topic match ·</span>
            <span className="text-brand-secondary hover:underline cursor-pointer">#{post.topicName}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-text-secondary pt-4 border-t border-surface-border/50">
          <div className="flex items-center space-x-6">
            <button className="flex items-center group/btn hover:text-brand-accent transition-colors font-medium text-sm cursor-pointer">
              <div className="p-1.5 rounded-full group-hover/btn:bg-brand-accent/10 transition-colors mr-1">
                <Heart className="w-4 h-4" />
              </div>
              <span>{post.likeCount !== undefined ? post.likeCount : 124}</span>
            </button>
            <button className="flex items-center group/btn hover:text-brand-secondary transition-colors font-medium text-sm cursor-pointer">
              <div className="p-1.5 rounded-full group-hover/btn:bg-brand-secondary/10 transition-colors mr-1">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span>{post.replyCount !== undefined ? post.replyCount : 18}</span>
            </button>
            <button className="flex items-center group/btn hover:text-status-success transition-colors font-medium text-sm cursor-pointer">
              <div className="p-1.5 rounded-full group-hover/btn:bg-status-success/10 transition-colors mr-1">
                <Repeat className="w-4 h-4" />
              </div>
              <span>{post.repostCount !== undefined ? post.repostCount : 5}</span>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            {post.externalUrl && (
              <a 
                href={post.externalUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-text-tertiary hover:text-white transition-colors flex items-center gap-1 cursor-pointer bg-surface-base px-2 py-1 rounded-md border border-surface-border hover:border-text-tertiary"
              >
                View original ↗
              </a>
            )}
            
            <button 
              onClick={handleTrust}
              disabled={trusted || post.authorId === currentUserId}
              className={`flex items-center gap-2 text-xs px-4 py-2 rounded-full font-bold transition-all duration-300 cursor-pointer shadow-md ${
                trusted
                  ? "bg-status-success/10 text-status-success border border-status-success/30 cursor-default"
                  : "bg-gradient-to-r from-brand-primary to-brand-accent text-white hover:shadow-[0_0_15px_rgba(138,43,226,0.5)] active:scale-95"
              }`}
            >
              {trusted ? (
                <>✓ Trusted</>
              ) : (
                <>Trust User</>
              )}
              {trustCount > 0 && <span className={trusted ? "text-status-success/70" : "text-white/70"}>· {trustCount}</span>}
            </button>
          </div>
        </div>
      </article>
    </TiltCard>
  )
}
