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

  const scoreColor = humanScore >= 90 ? "text-green-600" : humanScore >= 70 ? "text-yellow-600" : "text-red-500"
  const scoreBg = humanScore >= 90 ? "bg-green-50 border-green-200" : humanScore >= 70 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-xl mx-auto pt-20 px-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-6">
          <div className="flex items-center gap-3 mb-4">
            {session?.user?.image && (
              <img src={session.user.image} className="w-9 h-9 rounded-full" alt="avatar" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
              <select
                value={topicId}
                onChange={e => setTopicId(e.target.value)}
                className="text-xs text-blue-600 bg-transparent border-none outline-none cursor-pointer"
              >
                {DEFAULT_TOPICS.map(t => (
                  <option key={t.id} value={t.id}>Posting on {t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <textarea
            value={content}
            onChange={handleChange}
            onPaste={handlePaste}
            placeholder="What do you know that others should trust?"
            className="w-full text-gray-900 text-sm resize-none outline-none placeholder-gray-400 min-h-[120px]"
            maxLength={500}
          />
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${scoreBg}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${humanScore >= 90 ? "bg-green-500" : humanScore >= 70 ? "bg-yellow-500" : "bg-red-500"}`} />
              <span className={scoreColor}>{humanScore}% human confidence</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{content.length}/500</span>
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || submitting}
                className="bg-blue-600 text-white text-sm px-5 py-2 rounded-full hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                {submitting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
