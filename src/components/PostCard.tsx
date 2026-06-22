"use client"
import { useState } from "react"
import { Post } from "@/types"
import TiltCard from "@/components/TiltCard"

interface Props {
  post: Post
  currentUserId?: string
}

export default function PostCard({ post, currentUserId }: Props) {
  const [trusted, setTrusted] = useState(false)
  const [trustCount, setTrustCount] = useState(post.trustCount ?? 0)
  const [isHovered, setIsHovered] = useState(false)

  const isHigh = post.humanScore >= 90
  const isMid = post.humanScore >= 70 && post.humanScore < 90

  // Status colors intentionally left as semantic green/yellow/red — not remapped
  const scoreColor = isHigh
    ? "text-[#16A34A] bg-[#F0FDF4] border-[#16A34A]/20"
    : isMid
    ? "text-[#B45309] bg-[#FFFBEB] border-[#B45309]/20"
    : "text-[#DC2626] bg-[#FEF2F2] border-[#DC2626]/20"

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
    <TiltCard maxTilt={7}>
      <div className="bg-surface p-6 rounded-3xl hover:bg-surface-secondary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
        <div className="flex items-start gap-4">
          {post.authorImage ? (
            <img src={post.authorImage} className="w-10 h-10 rounded-full flex-shrink-0 object-cover border border-border-app shadow-sm" alt={post.authorName} />
          ) : (
            <div className="w-10 h-10 rounded-full bg-accent-soft border border-border-app text-accent flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
              {post.authorName.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-sm font-semibold text-text-primary hover:underline cursor-pointer">{post.authorName}</span>
              <span className="text-xs text-text-tertiary">·</span>
              <span className="text-xs text-text-tertiary">{timeAgo(post.createdAt)}</span>
              
              {/* Human Confidence Score Badge — semantic status colors preserved */}
              <div className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${scoreColor}`}>
                {isHigh || isMid ? (
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
                <span>{post.humanScore}% human</span>
              </div>
            </div>

            {/* Topic Tag */}
            <span className="inline-block text-[11px] font-medium text-accent bg-accent-soft px-2.5 py-0.5 rounded-full mb-2.5 hover:bg-accent/10 transition-colors cursor-pointer">
              #{post.topicName}
            </span>

            <p className="text-sm text-text-secondary leading-relaxed mb-4 font-normal whitespace-pre-wrap">{post.content}</p>

            {/* Trust Provenance Card */}
            <div className="bg-accent-soft/40 p-3.5 mb-4 border-l-2 border-accent">
              <p className="text-[11px] font-medium text-text-tertiary mb-2 flex items-center gap-1">
                <span className="text-accent font-bold">↳</span> Why you see this
              </p>
              
              {/* Connected Avatars */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Author Node */}
                <div className="flex items-center gap-1.5 bg-surface border border-border-app shadow-sm rounded-full pl-1.5 pr-2.5 py-1">
                  {post.authorImage ? (
                    <img src={post.authorImage} className="w-4 h-4 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center text-[9px] font-bold">
                      {post.authorName.charAt(0)}
                    </div>
                  )}
                  <span className="text-[11px] font-medium text-text-secondary">{post.authorName}</span>
                </div>
                
                {/* Direction Indicator */}
                <svg className="w-3 h-3 text-text-tertiary rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                
                {/* Target Node */}
                <div className="flex items-center gap-1.5 bg-accent-soft border border-accent/15 shadow-sm rounded-full pl-1.5 pr-2.5 py-1">
                  <div className="w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center text-[9px] font-bold">
                    Y
                  </div>
                  <span className="text-[11px] font-semibold text-accent">You</span>
                </div>
                
                <span className="text-[11px] text-text-tertiary font-normal ml-1">
                  · 100% topic match · #{post.topicName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Trust Button */}
              <button
                onClick={handleTrust}
                disabled={trusted || post.authorId === currentUserId}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`flex items-center gap-1.5 text-xs px-4 py-2 rounded-full border transition-all duration-300 ${
                  trusted
                    ? "bg-accent-soft border-accent/30 text-accent font-medium"
                    : "border-border-app text-text-secondary hover:bg-accent-soft/40 hover:border-accent/45 hover:text-accent"
                } disabled:opacity-40 disabled:pointer-events-none cursor-pointer`}
              >
                <span className="relative flex items-center justify-center w-4 h-4 overflow-hidden">
                  {trusted ? (
                    <svg className="w-4 h-4 text-accent animate-scaleIn" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center transition-all duration-300">
                      <svg className={`w-3.5 h-3.5 transition-all duration-300 ${isHovered ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <svg className={`w-3.5 h-3.5 absolute transition-all duration-300 ${isHovered ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </span>
                  )}
                </span>
                <span>{trusted ? "Trusted" : `Trust on ${post.topicName.split(" ")[0]}`}</span>
                {trustCount > 0 && <span className="text-text-tertiary font-normal">· {trustCount}</span>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </TiltCard>
  )
}
