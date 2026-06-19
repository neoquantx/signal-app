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
  const startTime = useRef(Date.now())
  const pasteDetected = useRef(false)
  const lastLength = useRef(0)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    typingEvents.current++
    if (val.length < lastLength.current) editCount.current++
    lastLength.current = val.length
    setContent(val)
    const timeSpent = (Date.now() - startTime.current) / 1000
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

  const scoreColor = humanScore >= 90
    ? "text-[#16A34A]"
    : humanScore >= 70
    ? "text-[#B45309]"
    : "text-[#DC2626]"

  const scoreBg = humanScore >= 90
    ? "bg-[#F0FDF4] border-[#16A34A]/25"
    : humanScore >= 70
    ? "bg-[#FFFBEB] border-[#B45309]/25"
    : "bg-[#FEF2F2] border-[#DC2626]/25"

  const dotColor = humanScore >= 90
    ? "bg-[#16A34A]"
    : humanScore >= 70
    ? "bg-[#B45309]"
    : "bg-[#DC2626]"

  // SVG Circular progress properties
  const maxLength = 500
  const characterCount = content.length
  const percentage = Math.min(100, (characterCount / maxLength) * 100)
  const radius = 16
  const strokeWidth = 3.5
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <main className="max-w-xl mx-auto pt-24 px-4 pb-16 animate-fade-in">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 mt-6 shadow-sm shadow-slate-100/40">
          
          {/* User profile section */}
          <div className="flex items-center gap-3 mb-5">
            {session?.user?.image ? (
              <img src={session.user.image} className="w-10 h-10 rounded-full border border-slate-100 shadow-sm" alt="avatar" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-sm">
                {session?.user?.name?.charAt(0) ?? "U"}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">{session?.user?.name}</p>
              <p className="text-xs text-slate-400">Drafting verified broadcast</p>
            </div>
          </div>

          {/* Horizontal Chips Topic Selector */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-[#475569] mb-2.5">Topic area</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
              {DEFAULT_TOPICS.map(t => {
                const isSelected = topicId === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTopicId(t.id)}
                    className={`text-xs px-3.5 py-2 rounded-full border transition-all duration-200 whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? "bg-[#EFF6FF] border-[#2563EB] text-[#2563EB] font-semibold shadow-sm"
                        : "bg-white border-[#E2E8F0] text-[#475569] hover:border-[#2563EB]/40 hover:text-[#2563EB]"
                    }`}
                  >
                    {t.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Large text block: min-h-[200px] */}
          <textarea
            value={content}
            onChange={handleChange}
            onPaste={handlePaste}
            placeholder="What do you know that others should trust?"
            className="w-full text-[#0F172A] text-sm resize-none outline-none placeholder-slate-400 min-h-[200px] bg-white border border-[#F1F5F9] rounded-2xl p-4 focus:border-[#2563EB]/40 transition-colors duration-200"
            maxLength={maxLength}
          />

          {/* Indicators Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#F1F5F9]">
            {/* Smoothly animated human score badge */}
            <div className={`flex items-center gap-2 text-xs px-3.5 py-2 rounded-full border transition-all duration-500 ease-in-out ${scoreBg}`}>
              <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${dotColor}`} />
              <span className={`font-semibold transition-colors duration-500 ${scoreColor}`}>
                {humanScore}% human confidence
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Circular Character Count Progress Indicator */}
              <div className="relative flex items-center justify-center w-9 h-9">
                <svg className="w-9 h-9 transform -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r={radius}
                    className="stroke-[#F1F5F9]"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r={radius}
                    className={`transition-all duration-300 ${
                      characterCount >= 470
                        ? "stroke-[#DC2626]"
                        : characterCount >= 400
                        ? "stroke-[#B45309]"
                        : "stroke-[#2563EB]"
                    }`}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[9px] font-bold text-[#475569]">
                  {maxLength - characterCount}
                </span>
              </div>
            </div>
          </div>

          {/* Full-width Submit button when content exists */}
          {content.trim() && (
            <div className="mt-4 pt-4 border-t border-[#F1F5F9] animate-fade-in">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm py-3 rounded-xl font-semibold shadow-md shadow-blue-500/15 hover:shadow-lg transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Publishing...
                  </>
                ) : (
                  "Share with your trust network"
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
