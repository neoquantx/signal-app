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
  const [topicId, setTopicId] = useState("ai")
  const [submitting, setSubmitting] = useState(false)
  const [humanScore, setHumanScore] = useState(100)

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
    setSubmitting(true)
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, topicId, humanScore }),
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
      <main className="flex-1 flex items-center justify-center py-12 px-4 animate-fade-in mt-16 min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-2xl dark-glass-panel rounded-3xl p-8 shadow-2xl transition-all duration-300 border border-white/10">
          
          <div className="flex items-center gap-4 mb-6">
            {session?.user?.image ? (
              <img src={session.user.image} className="w-12 h-12 rounded-full border border-white/20 shadow-sm object-cover" alt="avatar" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-accent-green/30 border border-white/20 text-accent-cream flex items-center justify-center font-bold text-lg">
                {session?.user?.name?.charAt(0) ?? "U"}
              </div>
            )}
            <div>
              <p className="text-base font-semibold text-accent-cream">{session?.user?.name}</p>
              <p className="text-sm text-white/60">Drafting verified broadcast</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm font-medium text-white/80 mb-3">Topic area</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
              {DEFAULT_TOPICS.map(t => {
                const isSelected = topicId === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTopicId(t.id)}
                    className={`text-sm px-4 py-2 rounded-full border transition-all duration-200 whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? "bg-accent-green/40 border-accent-green text-accent-cream font-medium shadow-sm"
                        : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
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
            className="w-full text-accent-cream text-base resize-none outline-none placeholder-white/40 min-h-[240px] bg-black/20 border border-white/10 rounded-2xl p-5 focus:border-accent-green/50 focus:bg-black/30 transition-all duration-300 backdrop-blur-md"
            maxLength={maxLength}
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6 pt-5 border-t border-white/10 gap-4">
            <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-full border transition-all duration-500 ease-in-out ${
              humanScore >= 90 ? "bg-accent-green/20 border-accent-green/40" : 
              humanScore >= 70 ? "bg-yellow-500/20 border-yellow-500/40" : 
              "bg-red-500/20 border-red-500/40"
            }`}>
              <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                humanScore >= 90 ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" : 
                humanScore >= 70 ? "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]" : 
                "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]"
              }`} />
              <span className={`font-medium transition-colors duration-500 ${
                humanScore >= 90 ? "text-green-400" : 
                humanScore >= 70 ? "text-yellow-400" : 
                "text-red-400"
              }`}>
                {humanScore}% human confidence
              </span>
            </div>

            <div className="flex items-center gap-4 ml-auto w-full sm:w-auto justify-end">
              <div className="relative flex items-center justify-center w-10 h-10">
                <svg className="w-10 h-10 transform -rotate-90">
                  <circle
                    cx="20" cy="20" r={radius}
                    className="stroke-white/10"
                    strokeWidth={strokeWidth} fill="transparent"
                  />
                  <circle
                    cx="20" cy="20" r={radius}
                    className={`transition-all duration-300 ${
                      characterCount >= 470 ? "stroke-red-500" :
                      characterCount >= 400 ? "stroke-yellow-500" :
                      "stroke-accent-green"
                    }`}
                    strokeWidth={strokeWidth} fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-white/60">
                  {maxLength - characterCount}
                </span>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !content.trim()}
                className="bg-accent-cream text-accent-green px-6 py-2.5 rounded-full font-semibold hover:bg-opacity-90 active:scale-95 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
