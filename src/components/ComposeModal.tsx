"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DEFAULT_TOPICS } from "@/lib/topics"
import { X, ShieldCheck } from "lucide-react"

function computeHumanScore(
  typingEvents: number,
  editCount: number,
  timeSpent: number,
  pasteDetected: boolean,
  charCount: number,
): number {
  let score = 100
  if (pasteDetected) score -= 30
  if (typingEvents < charCount * 0.5) score -= 20
  if (timeSpent < 3) score -= 25
  if (editCount === 0 && charCount > 50) score -= 10
  return Math.max(10, Math.min(100, score))
}

const MAX = 500

export default function ComposeModal({
  open,
  onClose,
  onPosted,
}: {
  open: boolean
  onClose: () => void
  onPosted?: () => void
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const [content, setContent] = useState("")
  const [topicId, setTopicId] = useState("ai")
  const [submitting, setSubmitting] = useState(false)
  const [humanScore, setHumanScore] = useState(100)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const typingEvents = useRef(0)
  const editCount = useRef(0)
  const startTime = useRef(Date.now())
  const pasteDetected = useRef(false)
  const lastLength = useRef(0)

  const reset = useCallback(() => {
    setContent("")
    setTopicId("ai")
    setHumanScore(100)
    typingEvents.current = 0
    editCount.current = 0
    startTime.current = Date.now()
    pasteDetected.current = false
    lastLength.current = 0
  }, [])

  useEffect(() => {
    if (open) {
      reset()
      const t = setTimeout(() => textareaRef.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [open, reset])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (open) window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    typingEvents.current++
    if (val.length < lastLength.current) editCount.current++
    lastLength.current = val.length
    setContent(val)
    const timeSpent = (Date.now() - startTime.current) / 1000
    setHumanScore(
      computeHumanScore(typingEvents.current, editCount.current, timeSpent, pasteDetected.current, val.length),
    )
  }

  function handlePaste() {
    pasteDetected.current = true
    setHumanScore((p) => Math.max(10, p - 30))
  }

  async function handleSubmit() {
    if (!content.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, topicId, humanScore }),
      })
      if (res.ok) {
        onClose()
        if (onPosted) onPosted()
        else router.refresh()
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const tone =
    humanScore >= 90
      ? { text: "text-verified", bg: "bg-green-50", border: "border-green-200", dot: "bg-verified" }
      : humanScore >= 70
        ? { text: "text-suspicious", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-suspicious" }
        : { text: "text-bot", bg: "bg-red-50", border: "border-red-200", dot: "bg-bot" }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-900/40 backdrop-blur-sm p-4 pt-[12vh]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Compose a post"
    >
      <div
        className="animate-modal-in w-full max-w-xl rounded-2xl bg-card shadow-2xl ring-1 ring-slate-900/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {session?.user?.image ? (
              <img src={session.user.image || "/placeholder.svg"} className="h-9 w-9 rounded-full" alt="" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-muted" />
            )}
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">{session?.user?.name ?? "You"}</p>
              <p className="text-xs text-muted-foreground">Posting publicly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onPaste={handlePaste}
            placeholder="What do you know that others should trust?"
            className="min-h-[140px] w-full resize-none bg-transparent text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
            maxLength={MAX}
          />

          {/* Topic selector */}
          <div className="mt-2">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Topic</p>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {DEFAULT_TOPICS.map((t) => {
                const active = t.id === topicId
                return (
                  <button
                    key={t.id}
                    onClick={() => setTopicId(t.id)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    #{t.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${tone.bg} ${tone.border} ${tone.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${tone.dot} animate-pulse-dot`} />
            <ShieldCheck className="h-3.5 w-3.5" />
            {humanScore}% human confidence
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums text-muted-foreground">
              {content.length}/{MAX}
            </span>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || submitting}
              className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
