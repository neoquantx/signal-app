"use client"
import { useEffect, useState } from "react"
import { getTopicsByCategory, type Topic } from "@/lib/topics"

interface DiscoverPost {
  id: string
  source: string
  authorName: string
  authorHandle: string
  authorImage: string
  content: string
  topicId: string
  topicName: string
  humanScore: number
  likeCount: number
  repostCount: number
  replyCount: number
  createdAt: string
  externalUrl: string
}

export default function DiscoverClient() {
  const grouped = getTopicsByCategory()
  const categories = Object.keys(grouped)
  const [activeTopic, setActiveTopic] = useState("ai")
  const [posts, setPosts] = useState<DiscoverPost[]>([])
  const [loading, setLoading] = useState(true)
  const [trustedHandles, setTrustedHandles] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setLoading(true)
    fetch(`/api/discover?topic=${activeTopic}`)
      .then(r => r.json())
      .then(d => { setPosts(d.posts ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [activeTopic])

  async function handleTrust(handle: string, topicId: string) {
    const key = `${handle}-${topicId}`
    setTrustedHandles(prev => ({ ...prev, [key]: true }))
    await fetch("/api/trust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trusteeId: `bluesky:${handle}`, topicId }),
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sticky top-20 max-h-[75vh] overflow-y-auto">
          <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wide">Topics</p>
          {categories.map(cat => (
            <div key={cat} className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-1.5">{cat}</p>
              <div className="flex flex-col gap-1">
                {grouped[cat].map((t: Topic) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTopic(t.id)}
                    className={`text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                      activeTopic === t.id
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-900">Live from Bluesky · scored by Signal</h2>
          <span className="text-xs text-gray-400">Real posts, real authenticity check</span>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-28" />
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-sm text-gray-500">No posts found for this topic right now</p>
          </div>
        )}

        {!loading && posts.map(post => {
          const scoreColor = post.humanScore >= 90 ? "text-green-600 bg-green-50 border-green-200"
            : post.humanScore >= 70 ? "text-yellow-600 bg-yellow-50 border-yellow-200"
            : "text-red-500 bg-red-50 border-red-200"
          const dotColor = post.humanScore >= 90 ? "bg-green-500" : post.humanScore >= 70 ? "bg-yellow-500" : "bg-red-500"
          const key = `${post.authorHandle}-${post.topicId}`

          return (
            <div key={post.id} className="bg-white rounded-2xl border border-gray-100 p-5 mb-3">
              <div className="flex items-start gap-3">
                {post.authorImage ? (
                  <img src={post.authorImage} className="w-9 h-9 rounded-full flex-shrink-0" alt="" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-gray-900">{post.authorName}</span>
                      <span className="text-xs text-gray-400 ml-2">@{post.authorHandle}</span>
                      <span className="text-xs text-blue-500 ml-2 bg-blue-50 px-1.5 py-0.5 rounded-full">via Bluesky</span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border flex-shrink-0 ${scoreColor}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                      {post.humanScore}% human
                    </div>
                  </div>

                  <span className="inline-block text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mb-2">
                    {post.topicName}
                  </span>

                  <p className="text-sm text-gray-800 leading-relaxed mb-3">{post.content}</p>

                  <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-100">
                    <p className="text-xs text-gray-400 mb-1.5">↳ Why you see this</p>
                    <p className="text-xs text-gray-500">
                      Imported from Bluesky · matched topic <b>{post.topicName}</b> · authenticity score computed from content + engagement pattern (no behavioral signal available for external posts)
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleTrust(post.authorHandle, post.topicId)}
                      disabled={trustedHandles[key]}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                        trustedHandles[key]
                          ? "bg-blue-50 border-blue-200 text-blue-600"
                          : "border-gray-200 text-gray-500 hover:border-blue-200 hover:text-blue-600"
                      }`}
                    >
                      {trustedHandles[key] ? "✓ Trusted" : `Trust on ${post.topicName.split(" ")[0]}`}
                    </button>
                    <a href={post.externalUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-gray-600">
                      View on Bluesky ↗
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
