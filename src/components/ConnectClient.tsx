"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"

// ---------------------------------------------------------------------------
// Platform definitions
// ---------------------------------------------------------------------------
interface Platform {
  id: string
  name: string
  description: string
  color: string
  enabled: boolean
}

const PLATFORMS: Platform[] = [
  { id: "bluesky",   name: "Bluesky",     description: "Live posts, scored for authenticity in real time", color: "#1185FE", enabled: true  },
  { id: "x",         name: "X (Twitter)", description: "Coming soon — API access is paid-only right now",  color: "#000000", enabled: false },
  { id: "instagram", name: "Instagram",   description: "Coming soon — requires platform app review",        color: "#E1306C", enabled: false },
  { id: "threads",   name: "Threads",     description: "Coming soon",                                       color: "#000000", enabled: false },
  { id: "reddit",    name: "Reddit",      description: "Coming soon",                                       color: "#FF4500", enabled: false },
  { id: "mastodon",  name: "Mastodon",    description: "Coming soon",                                       color: "#6364FF", enabled: false },
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface BlueskyStatus {
  connected: boolean
  handle?: string
  linkedAt?: string
}

// ---------------------------------------------------------------------------
// ConnectClient
// ---------------------------------------------------------------------------
export default function ConnectClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ---- Bluesky real OAuth state ----
  const [bskyStatus, setBskyStatus] = useState<BlueskyStatus | null>(null) // null = loading
  const [bskyBusy, setBskyBusy] = useState(false)
  const [showHandleInput, setShowHandleInput] = useState(false)
  const [handleInput, setHandleInput] = useState("")
  const [handleError, setHandleError] = useState<string | null>(null)
  const handleInputRef = useRef<HTMLInputElement>(null)

  // ---- Error banner from OAuth callback redirect ----
  const [oauthError, setOauthError] = useState<string | null>(null)

  // ---- Other platforms (cosmetic / coming-soon) ----
  const [connectedOther, setConnectedOther] = useState<string[]>([])
  const [busyOther, setBusyOther] = useState<string | null>(null)

  // ---- Load Bluesky status on mount ----
  useEffect(() => {
    fetch("/api/bluesky-oauth/status")
      .then(r => r.json())
      .then((d: BlueskyStatus) => setBskyStatus(d))
      .catch(() => setBskyStatus({ connected: false }))
  }, [])

  // ---- Load other platforms' cosmetic state on mount ----
  useEffect(() => {
    fetch("/api/users/connect-platform")
      .then(r => r.json())
      .then(d => setConnectedOther(d.connectedPlatforms ?? []))
      .catch(() => {})
  }, [])

  // ---- Read error / desc from URL search params (set by OAuth callback redirect) ----
  useEffect(() => {
    const error = searchParams.get("error")
    if (!error) return

    const desc = searchParams.get("desc")
    let msg = `Bluesky connection failed (${error}). Try again below.`
    if (error === "access_denied") {
      msg = "Bluesky connection was cancelled or denied. Try again below."
    } else if (desc) {
      msg = `Bluesky connection failed: ${decodeURIComponent(desc)}`
    }

    const timer = setTimeout(() => {
      setOauthError(msg)
    }, 0)

    // Clean the URL so a refresh doesn't re-show the banner
    const clean = new URL(window.location.href)
    clean.searchParams.delete("error")
    clean.searchParams.delete("desc")
    window.history.replaceState({}, "", clean.toString())

    return () => clearTimeout(timer)
  }, [searchParams])

  // ---- Focus handle input when it appears ----
  useEffect(() => {
    if (showHandleInput) handleInputRef.current?.focus()
  }, [showHandleInput])

  // ---- Bluesky: start OAuth flow ----
  function handleBlueskyConnect() {
    if (showHandleInput) {
      // Already showing — just focus
      handleInputRef.current?.focus()
      return
    }
    setShowHandleInput(true)
    setHandleError(null)
    setHandleInput("")
  }

  function handleBlueskySubmit(e: React.FormEvent) {
    e.preventDefault()
    const h = handleInput.trim()
    if (!h) {
      setHandleError("Please enter your Bluesky handle.")
      return
    }
    // Full-page navigation — OAuth requires real browser redirects
    window.location.href = `/api/bluesky-oauth/login?handle=${encodeURIComponent(h)}`
  }

  // ---- Bluesky: disconnect ----
  async function handleBlueskyDisconnect() {
    setBskyBusy(true)
    try {
      await fetch("/api/bluesky-oauth/disconnect", { method: "DELETE" })
      setBskyStatus({ connected: false })
      setShowHandleInput(false)
      setHandleInput("")
      setHandleError(null)
    } catch {
      // Silently ignore — user can retry
    } finally {
      setBskyBusy(false)
    }
  }

  // ---- Other platforms: connect (cosmetic) ----
  const handleOtherConnect = useCallback(async (platformId: string) => {
    setBusyOther(platformId)
    const start = Date.now()
    await fetch("/api/users/connect-platform", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: platformId }),
    })
    const elapsed = Date.now() - start
    if (elapsed < 900) await new Promise(r => setTimeout(r, 900 - elapsed))
    setConnectedOther(prev => [...prev, platformId])
    setBusyOther(null)
  }, [])

  // ---- Other platforms: disconnect (cosmetic) ----
  const handleOtherDisconnect = useCallback(async (platformId: string) => {
    setBusyOther(platformId)
    await fetch("/api/users/connect-platform", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: platformId }),
    })
    setConnectedOther(prev => prev.filter(p => p !== platformId))
    setBusyOther(null)
  }, [])

  // ---- Render ----
  return (
    <div className="max-w-2xl">
      {/* OAuth error banner — semantic red preserved */}
      {oauthError && (
        <div className="mb-4 flex items-start gap-3 bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3">
          <span className="text-red-400 mt-0.5 shrink-0">⚠️</span>
          <p className="text-xs text-red-300 flex-1">{oauthError}</p>
          <button
            onClick={() => setOauthError(null)}
            className="text-red-400 hover:text-red-300 text-sm leading-none shrink-0"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/*
        Task 4: grid-cols-1 on mobile, grid-cols-2 on sm+
        Task 5: input has id + associated label (sr-only for Bluesky handle field)
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLATFORMS.map(p => {
          // ----------------------------------------------------------------
          // Bluesky card — real OAuth flow
          // ----------------------------------------------------------------
          if (p.id === "bluesky") {
            const isLoading = bskyStatus === null
            const isConnected = bskyStatus?.connected === true
            const isBusy = bskyBusy || isLoading

            return (
              <div
                key="bluesky"
                className="glass-panel rounded-3xl p-6 flex flex-col gap-4 shadow-xl hover:translate-y-[-2px] transition-all"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                      style={{ backgroundColor: p.color }}
                    >
                      B
                    </div>
                    <span className="text-base font-bold text-white">{p.name}</span>
                  </div>
                </div>

                <p className="text-xs text-white/70 leading-relaxed">{p.description}</p>

                {/* Connected state — semantic green preserved */}
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-xs px-3 py-2 rounded-full font-medium bg-green-500/20 text-green-400 border border-green-500/30 truncate text-center">
                      ✓ Connected as @{bskyStatus!.handle}
                    </span>
                    <button
                      onClick={handleBlueskyDisconnect}
                      disabled={isBusy}
                      className="text-xs px-4 py-2 bg-white/5 hover:bg-red-500/20 text-on-surface hover:text-red-400 border border-white/10 rounded-full font-medium transition-all disabled:opacity-40 shrink-0"
                    >
                      {bskyBusy ? "…" : "Disconnect"}
                    </button>
                  </div>
                ) : (
                  /* Not-connected state */
                  <div className="flex flex-col gap-2">
                    {/* Handle input form — shown after clicking Connect */}
                    {showHandleInput ? (
                      <form onSubmit={handleBlueskySubmit} className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          {/* Task 5: label (sr-only) + id for a11y */}
                          <label htmlFor="bluesky-handle-input" className="sr-only">
                            Bluesky handle
                          </label>
                          <input
                            ref={handleInputRef}
                            id="bluesky-handle-input"
                            name="bluesky-handle"
                            type="text"
                            value={handleInput}
                            onChange={e => {
                              setHandleInput(e.target.value)
                              setHandleError(null)
                            }}
                            placeholder="yourhandle.bsky.social"
                            className="flex-1 text-xs px-3 py-2 rounded-full border border-white/10 bg-black/20 text-accent-cream placeholder-white/30 focus:border-accent-green/50 focus:outline-none focus:ring-2 focus:ring-accent-green/20 transition-all"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                          />
                          <button
                            type="submit"
                            className="text-xs px-4 py-2 rounded-full font-medium bg-accent-green text-white hover:bg-opacity-90 transition-colors shrink-0 cursor-pointer"
                          >
                            Go
                          </button>
                        </div>
                        {handleError && (
                          <p className="text-xs text-red-400 px-1">{handleError}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => { setShowHandleInput(false); setHandleError(null) }}
                          className="text-xs text-white/60 hover:text-white self-start px-1"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      /* Initial connect button */
                      <button
                        onClick={handleBlueskyConnect}
                        disabled={isLoading}
                        className="text-xs px-3 py-2.5 rounded-full font-semibold bg-accent-green text-white hover:bg-opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {isLoading ? (
                          <>
                            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Checking…
                          </>
                        ) : (
                          "Connect"
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          }

          // ----------------------------------------------------------------
          // All other platform cards — coming-soon logic (cosmetic)
          // ----------------------------------------------------------------
          const isConnected = connectedOther.includes(p.id)
          const isBusy = busyOther === p.id

          return (
            <div
              key={p.id}
              className={`glass-panel rounded-3xl p-6 flex flex-col gap-4 shadow-xl hover:translate-y-[-2px] transition-all ${
                p.enabled ? "" : "opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name.charAt(0)}
                  </div>
                  <span className="text-base font-bold text-white">{p.name}</span>
                </div>
                {!p.enabled && (
                  <span className="text-[10px] text-white/50 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full font-medium">
                    Coming soon
                  </span>
                )}
              </div>
              <p className="text-xs text-white/70 leading-relaxed">{p.description}</p>

              {isConnected ? (
                <div className="flex items-center gap-2">
                  {/* Connected state — semantic green preserved */}
                  <span className="flex-1 text-xs px-3 py-2 rounded-full font-medium bg-green-500/20 text-green-400 border border-green-500/30 text-center">
                    ✓ Connected
                  </span>
                  <button
                    onClick={() => handleOtherDisconnect(p.id)}
                    disabled={isBusy}
                    className="text-xs px-4 py-2 bg-white/5 hover:bg-red-500/20 text-on-surface hover:text-red-400 border border-white/10 rounded-full font-medium transition-all disabled:opacity-40"
                  >
                    {isBusy ? "…" : "Disconnect"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => p.enabled && handleOtherConnect(p.id)}
                  disabled={!p.enabled || isBusy}
                  className={`text-xs px-3 py-2.5 rounded-full font-semibold transition-all flex items-center justify-center gap-2 ${
                    p.enabled
                      ? "bg-accent-green text-white hover:bg-opacity-90 active:scale-95 cursor-pointer shadow-md"
                      : "bg-white/5 text-white/40 border border-white/10 cursor-not-allowed"
                  }`}
                >
                  {isBusy && (
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {isBusy ? "Connecting…" : p.enabled ? "Connect" : "Not available"}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={() => router.push("/feed")}
        className="mt-6 text-xs text-white/50 hover:text-white cursor-pointer transition-colors"
      >
        Skip for now → go to feed
      </button>
    </div>
  )
}
