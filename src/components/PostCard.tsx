"use client"
import { useState } from "react"
import { Post } from "@/types"
import { ShieldCheck, MessageCircle, Share2, CornerDownRight, Check } from "lucide-react"

interface Props {
  post: Post
  currentUserId?: string
}

// Deterministic pseudo-values so the provenance card is stable per post.
function hash(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

const CHAIN_NAMES = ["Priya", "Arnav", "Mei", "Diego", "Sara", "Leo", "Noor", "Kai"]

export default function PostCard({ post, currentUserId }: Props) {
  const [trusted, setTrusted] = useState(false)
  const [trustCount, setTrustCount] = useState(post.trustCount ?? 0)
  const [expanded, setExpanded] = useState(false)

  const tone =
    post.humanScore >= 90
      ? { text: "text-verified", bg: "bg-green-50", border: "border-green-200", dot: "bg-verified" }
      : post.humanScore >= 70
        ? { text: "text-suspicious", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-suspicious" }
        : { text: "text-bot", bg: "bg-red-50", border: "border-red-200", dot: "bg-bot" }

  const h = hash(post.id)
  const trustWeight = 50 + (h % 41) // 50–90
  const topicWeight = 100 - trustWeight
  const chainName = CHAIN_NAMES[h % CHAIN_NAMES.length]
  const showSecondHop = h % 3 !== 0

  const isLong = post.content.length > 180
  const topicLabel = post.topicName.split(" ")[0]

  async function handleTrust() {
    if (trusted || post.authorId === currentUserId) return
    setTrusted(true)
    setTrustCount((p) => p + 1)
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
    const d = Math.floor(diff / 86400000)
    if (d > 0) return `${d}d`
    if (h > 0) return `${h}h`
    if (m > 0) return `${m}m`
    return "now"
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-[0_2px_16px_-4px_rgba(15,23,42,0.08)]">
      {/* Author row */}
      <div className="flex items-start gap-3">
        {post.authorImage ? (
          <img src={post.authorImage || "/placeholder.svg"} className="h-9 w-9 shrink-0 rounded-full" alt="" />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {initials(post.authorName)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-foreground">{post.authorName}</span>
              <span className="text-xs text-muted-foreground">· {timeAgo(post.createdAt)}</span>
            </div>
            <div
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${tone.bg} ${tone.border} ${tone.text}`}
            >
              {post.humanScore >= 90 ? (
                <ShieldCheck className="h-3.5 w-3.5" />
              ) : (
                <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
              )}
              {post.humanScore}%
            </div>
          </div>

          {/* Topic chip */}
          <div className="mt-1.5">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-primary">
              #{topicLabel}
            </span>
          </div>

          {/* Content */}
          <p
            className={`mt-2 text-[15px] leading-relaxed text-foreground ${
              !expanded && isLong ? "line-clamp-3" : ""
            }`}
          >
            {post.content}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="mt-1 text-xs font-medium text-primary transition-colors hover:text-blue-700"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}

          {/* Trust provenance card */}
          <div className="mt-3 rounded-xl border-l-2 border-l-blue-200 bg-blue-50/40 px-3 py-2.5">
            <p className="mb-2 flex items-center gap-1 text-[11px] font-medium text-slate-400">
              <CornerDownRight className="h-3 w-3" />
              Why you see this
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <ChainChip label={chainName} />
              <Arrow />
              {showSecondHop && (
                <>
                  <ChainChip label={post.authorName.split(" ")[0]} />
                  <Arrow />
                </>
              )}
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                You
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                {trustWeight}% trust chain
              </span>
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-700">
                {topicWeight}% topic match
              </span>
            </div>
          </div>

          {/* Action row */}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleTrust}
              disabled={trusted || post.authorId === currentUserId}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                trusted
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {trusted ? <Check className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              {trusted ? "Trusted" : `Trust on ${topicLabel}`}
              {trustCount > 0 && <span className="text-muted-foreground">· {trustCount}</span>}
            </button>
            <button className="flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <MessageCircle className="h-3.5 w-3.5" />
              Reply
            </button>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Share"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function ChainChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium text-slate-600">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[8px] font-bold text-muted-foreground">
        {label[0]?.toUpperCase()}
      </span>
      {label}
    </span>
  )
}

function Arrow() {
  return <span className="text-xs text-slate-300">→</span>
}
