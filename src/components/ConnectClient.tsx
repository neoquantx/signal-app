"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Platform {
  id: string
  name: string
  description: string
  color: string
  enabled: boolean
}

const PLATFORMS: Platform[] = [
  { id: "bluesky", name: "Bluesky", description: "Live posts, scored for authenticity in real time", color: "#1185FE", enabled: true },
  { id: "x", name: "X (Twitter)", description: "Coming soon — API access is paid-only right now", color: "#000000", enabled: false },
  { id: "instagram", name: "Instagram", description: "Coming soon — requires platform app review", color: "#E1306C", enabled: false },
  { id: "threads", name: "Threads", description: "Coming soon", color: "#000000", enabled: false },
  { id: "reddit", name: "Reddit", description: "Coming soon", color: "#FF4500", enabled: false },
  { id: "mastodon", name: "Mastodon", description: "Coming soon", color: "#6364FF", enabled: false },
]

export default function ConnectClient() {
  const router = useRouter()
  const [connected, setConnected] = useState<string[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/users/connect-platform")
      .then(r => r.json())
      .then(d => setConnected(d.connectedPlatforms ?? []))
  }, [])

  async function handleConnect(platformId: string) {
    setBusy(platformId)
    const start = Date.now()
    await fetch("/api/users/connect-platform", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: platformId }),
    })
    const elapsed = Date.now() - start
    if (elapsed < 900) await new Promise(r => setTimeout(r, 900 - elapsed))
    setConnected(prev => [...prev, platformId])
    setBusy(null)
  }

  async function handleDisconnect(platformId: string) {
    setBusy(platformId)
    await fetch("/api/users/connect-platform", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: platformId }),
    })
    setConnected(prev => prev.filter(p => p !== platformId))
    setBusy(null)
  }

  return (
    <div className="max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLATFORMS.map(p => {
          const isConnected = connected.includes(p.id)
          const isBusy = busy === p.id
          return (
            <div key={p.id} className={`bg-white rounded-2xl border p-5 flex flex-col gap-3 ${p.enabled ? "border-gray-100" : "border-gray-100 opacity-60"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: p.color }}>
                    {p.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{p.name}</span>
                </div>
                {!p.enabled && <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Coming soon</span>}
              </div>
              <p className="text-xs text-gray-500">{p.description}</p>

              {isConnected ? (
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-xs px-3 py-2 rounded-full font-medium bg-green-50 text-green-600 border border-green-200 text-center">
                    ✓ Connected
                  </span>
                  <button
                    onClick={() => handleDisconnect(p.id)}
                    disabled={isBusy}
                    className="text-xs px-3 py-2 rounded-full font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    {isBusy ? "..." : "Disconnect"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => p.enabled && handleConnect(p.id)}
                  disabled={!p.enabled || isBusy}
                  className={`text-xs px-3 py-2 rounded-full font-medium transition-all flex items-center justify-center gap-2 ${
                    p.enabled ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {isBusy && (
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {isBusy ? "Connecting..." : p.enabled ? "Connect" : "Not available"}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <button onClick={() => router.push("/feed")} className="mt-6 text-xs text-gray-400 hover:text-gray-600">
        Skip for now → go to feed
      </button>
    </div>
  )
}
