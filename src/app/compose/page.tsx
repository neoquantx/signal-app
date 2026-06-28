"use client"
import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import { DEFAULT_TOPICS } from "@/lib/topics"

function computeHumanScore(
  typingEvents: number,
  editCount: number,
  timeSpent: number,
  pasteDetected: boolean,
  charCount: number
): number {
  let score = 100
  if (pasteDetected) score -= 30
  if (typingEvents < charCount * 0.5) score -= 20
  if (timeSpent < 3) score -= 25
  if (editCount === 0 && charCount > 50) score -= 10
  return Math.max(10, Math.min(100, score))
}

export default function ComposePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [content, setContent] = useState("")
  const [topicSearch, setTopicSearch] = useState("")
  const [selectedTopicId, setSelectedTopicId] = useState("ai")
  const [customTopicName, setCustomTopicName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [humanScore, setHumanScore] = useState(100)

  const filteredTopics = DEFAULT_TOPICS.filter(t => t.name.toLowerCase().includes(topicSearch.toLowerCase()))
  const isExactMatch = DEFAULT_TOPICS.some(t => t.name.toLowerCase() === topicSearch.trim().toLowerCase())

  const typingEvents = useRef(0)
  const editCount = useRef(0)
  const startTime = useRef<number | null>(null)
  const pasteDetected = useRef(false)
  const lastLength = useRef(0)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    startTime.current = Date.now()
  }, [status, router])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    typingEvents.current++
    if (val.length < lastLength.current) editCount.current++
    lastLength.current = val.length
    setContent(val)
    const start = startTime.current ?? Date.now()
    const timeSpent = (Date.now() - start) / 1000
    const score = computeHumanScore(
      typingEvents.current, editCount.current,
      timeSpent, pasteDetected.current, val.length
    )
    setHumanScore(score)
  }

  function handlePaste() {
    pasteDetected.current = true
    setHumanScore(prev => Math.max(10, prev - 30))
  }

  async function handleSubmit() {
    if (!content.trim() || submitting) return
    // Resolve topic for submission
    let finalTopicId = selectedTopicId
    let finalTopicName: string | undefined = undefined
    if (customTopicName) {
      finalTopicId = customTopicName.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-") || "custom"
      finalTopicName = customTopicName
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, topicId: finalTopicId, topicName: finalTopicName, humanScore }),
      })
      if (res.ok) router.push("/feed")
    } finally {
      setSubmitting(false)
    }
  }

  // SVG Circular progress properties
  const maxLength = 500
  const characterCount = content.length
  const percentage = Math.min(100, (characterCount / maxLength) * 100)
  const radius = 16
  const strokeWidth = 4
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <>
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 px-4 mt-16 min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-2xl bg-surface-elevated rounded-3xl p-8 shadow-sm transition-all duration-300 border border-surface-border">
          
          <div className="flex items-center gap-4 mb-6">
            {session?.user?.image ? (
              <img src={session.user.image} className="w-12 h-12 rounded-full border border-surface-border shadow-sm object-cover" alt="avatar" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center font-bold text-lg">
                {session?.user?.name?.charAt(0) ?? "U"}
              </div>
            )}
            <div>
              <p className="text-base font-semibold text-text-primary">{session?.user?.name}</p>
              <p className="text-sm text-text-secondary">Drafting verified broadcast</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm font-medium text-text-secondary mb-3">Topic area</p>
            <div className="mb-3 relative">
              <input
                type="text"
                value={topicSearch}
                onChange={e => setTopicSearch(e.target.value)}
                placeholder="Search topics or type your own to add..."
                className="w-full text-sm px-4 py-2.5 rounded-full border border-surface-border bg-surface-base text-text-primary placeholder-text-tertiary focus:border-brand-primary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all hover:bg-surface-glass-hover"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto scrollbar-none">
              {topicSearch.trim() && !isExactMatch && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomTopicName(topicSearch.trim())
                    setSelectedTopicId("custom")
                  }}
                  className={`text-sm px-4 py-2 rounded-full border transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    selectedTopicId === "custom" && customTopicName === topicSearch.trim()
                      ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary font-medium shadow-sm"
                      : "bg-surface-base border-surface-border text-text-secondary hover:bg-surface-glass-hover hover:text-text-primary"
                  }`}
                >
                  + Add &quot;{topicSearch.trim()}&quot;
                </button>
              )}
              {filteredTopics.map(t => {
                const isSelected = selectedTopicId === t.id && !customTopicName
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTopicId(t.id)
                      setCustomTopicName("")
                    }}
                    className={`text-sm px-4 py-2 rounded-full border transition-all duration-200 whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary font-medium shadow-sm"
                        : "bg-surface-base border-surface-border text-text-secondary hover:bg-surface-glass-hover hover:text-text-primary"
                    }`}
                  >
                    {t.name}
                  </button>
                )
              })}
            </div>
          </div>

          <label htmlFor="compose-content" className="sr-only">Post content</label>
          <textarea
            id="compose-content"
            value={content}
            onChange={handleChange}
            onPaste={handlePaste}
            placeholder="What do you know that others should trust?"
            className="w-full text-text-primary text-base resize-none outline-none placeholder-text-tertiary min-h-[240px] bg-surface-base border border-surface-border rounded-2xl p-5 focus:border-brand-primary/50 focus:bg-surface-glass-hover transition-all duration-300"
            maxLength={maxLength}
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6 pt-5 border-t border-surface-border gap-4">
            <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-full border transition-all duration-500 ease-in-out ${
              humanScore >= 90 ? "bg-status-success/10 border-status-success/20" : 
              humanScore >= 70 ? "bg-status-warning/10 border-status-warning/20" : 
              "bg-status-error/10 border-status-error/20"
            }`}>
              <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                humanScore >= 90 ? "bg-status-success shadow-[0_0_8px_rgba(34,197,94,0.3)]" : 
                humanScore >= 70 ? "bg-status-warning shadow-[0_0_8px_rgba(245,158,11,0.3)]" : 
                "bg-status-error shadow-[0_0_8px_rgba(239,68,68,0.3)]"
              }`} />
              <span className={`font-medium transition-colors duration-500 ${
                humanScore >= 90 ? "text-status-success" : 
                humanScore >= 70 ? "text-status-warning" : 
                "text-status-error"
              }`}>
                {humanScore}% human confidence
              </span>
            </div>

            <div className="flex items-center gap-4 ml-auto w-full sm:w-auto justify-end">
              <div className="relative flex items-center justify-center w-10 h-10">
                <svg className="w-10 h-10 transform -rotate-90">
                  <circle
                    cx="20" cy="20" r={radius}
                    className="stroke-surface-border"
                    strokeWidth={strokeWidth} fill="transparent"
                  />
                  <circle
                    cx="20" cy="20" r={radius}
                    className={`transition-all duration-300 ${
                      characterCount >= 470 ? "stroke-status-error" :
                      characterCount >= 400 ? "stroke-status-warning" :
                      "stroke-brand-primary"
                    }`}
                    strokeWidth={strokeWidth} fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-text-secondary">
                  {maxLength - characterCount}
                </span>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !content.trim()}
                className="bg-brand-primary text-white px-6 py-2.5 rounded-full font-semibold hover:bg-opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Publishing..." : "Post Signal"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
