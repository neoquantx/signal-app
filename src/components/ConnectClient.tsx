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
  { id: "x",         name: "X (Twitter)", description: "Coming soon — API access is paid-only right now",  color: "#FFFFFF", enabled: false },
  { id: "instagram", name: "Instagram",   description: "Coming soon — requires platform app review",        color: "#E1306C", enabled: false },
  { id: "threads",   name: "Threads",     description: "Coming soon",                                       color: "#FFFFFF", enabled: false },
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

  const [isRedirecting, setIsRedirecting] = useState(false)

  // ---- Load Bluesky status on mount ----
  useEffect(() => {
    fetch("/api/bluesky-oauth/status")
      .then(r => r.json())
      .then((d: BlueskyStatus) => {
        setBskyStatus(d)
        if (d.connected) {
          setIsRedirecting(true)
          setTimeout(() => {
            router.push("/feed")
          }, 1500)
        }
      })
      .catch(() => setBskyStatus({ connected: false }))
  }, [router])

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
      // Silently ignore
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

  return (
    <div className="max-w-3xl mx-auto w-full pt-16">
      {isRedirecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-base/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="glass-panel p-10 rounded-3xl flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(138,43,226,0.3)] border border-brand-primary/30">
            <div className="relative">
              <div className="absolute inset-0 rounded-full border-t-2 border-brand-primary animate-spin" style={{ width: '3rem', height: '3rem' }}></div>
              <div className="w-12 h-12 rounded-full border border-surface-border flex items-center justify-center bg-surface-glass">
                <span className="text-xl">✨</span>
              </div>
            </div>
            <span className="text-white text-base font-semibold tracking-wide bg-clip-text">Preparing your feed...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-12 text-center fade-in-up">
        <h1 className="text-4xl md:text-5xl font-serif text-white mb-4 tracking-tight drop-shadow-lg">Connect Platforms</h1>
        <p className="text-text-secondary text-base max-w-lg mx-auto font-light">
          Link your accounts to start building your trust-native social graph.
        </p>
      </div>

      {oauthError && (
        <div className="mb-8 flex items-start gap-3 bg-status-error/10 border border-status-error/20 rounded-2xl px-5 py-4 fade-in-up shadow-lg">
          <span className="text-status-error mt-0.5 shrink-0 text-lg">⚠️</span>
          <p className="text-sm text-status-error/90 flex-1 font-medium">{oauthError}</p>
          <button
            onClick={() => setOauthError(null)}
            className="text-status-error/70 hover:text-status-error text-sm leading-none shrink-0 p-1"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {PLATFORMS.map((p, index) => {
          // ----------------------------------------------------------------
          // Bluesky card
          // ----------------------------------------------------------------
          if (p.id === "bluesky") {
            const isLoading = bskyStatus === null
            const isConnected = bskyStatus?.connected === true
            const isBusy = bskyBusy || isLoading

            return (
              <div
                key="bluesky"
                className="glass-panel rounded-3xl p-7 flex flex-col gap-5 relative overflow-hidden group fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-primary)] to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none" />

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg transform group-hover:scale-105 transition-transform duration-300"
                      style={{ backgroundColor: p.color, boxShadow: `0 8px 24px ${p.color}40` }}
                    >
                      B
                    </div>
                    <span className="text-xl font-semibold text-white tracking-tight">{p.name}</span>
                  </div>
                </div>

                <p className="text-sm text-text-secondary leading-relaxed font-light relative z-10">{p.description}</p>

                <div className="mt-auto pt-2 relative z-10">
                  {isConnected ? (
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="flex-1 w-full flex items-center justify-center gap-2 text-sm px-4 py-3 rounded-2xl font-medium bg-status-success/10 text-status-success border border-status-success/20 truncate">
                        <span className="shrink-0">✓</span> Connected as @{bskyStatus!.handle}
                      </div>
                      <button
                        onClick={handleBlueskyDisconnect}
                        disabled={isBusy}
                        className="w-full sm:w-auto text-sm px-5 py-3 bg-surface-base hover:bg-status-error/10 text-text-secondary hover:text-status-error border border-surface-border rounded-2xl font-medium transition-all disabled:opacity-40 shrink-0"
                      >
                        {bskyBusy ? "…" : "Disconnect"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {showHandleInput ? (
                        <form onSubmit={handleBlueskySubmit} className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                          <label htmlFor="bluesky-handle-input" className="sr-only">
                            Bluesky handle
                          </label>
                          <div className="relative flex items-center group">
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
                              className="w-full text-sm px-4 py-3.5 pr-16 rounded-2xl border border-surface-border bg-surface-base text-white placeholder-text-tertiary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all shadow-inner"
                              autoCapitalize="none"
                              autoCorrect="off"
                              spellCheck={false}
                            />
                            <button
                              type="submit"
                              className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-xl font-medium bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer text-sm shadow-md"
                            >
                              Go
                            </button>
                          </div>
                          {handleError && (
                            <p className="text-xs text-status-error px-1 font-medium">{handleError}</p>
                          )}
                          <button
                            type="button"
                            onClick={() => { setShowHandleInput(false); setHandleError(null) }}
                            className="text-xs text-text-tertiary hover:text-white self-start px-1 uppercase tracking-wider font-semibold mt-1"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={handleBlueskyConnect}
                          disabled={isLoading}
                          className="w-full btn-primary px-4 py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 text-sm shadow-[0_4px_14px_0_rgba(138,43,226,0.39)]"
                        >
                          {isLoading ? (
                            <>
                              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                              Checking…
                            </>
                          ) : (
                            "Connect Account"
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          }

          // ----------------------------------------------------------------
          // All other platform cards
          // ----------------------------------------------------------------
          const isConnected = connectedOther.includes(p.id)
          const isBusy = busyOther === p.id

          return (
            <div
              key={p.id}
              className={`glass-panel rounded-3xl p-7 flex flex-col gap-5 relative overflow-hidden group fade-in-up ${
                p.enabled ? "" : "opacity-60 saturate-50"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {p.enabled && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              )}

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-surface-base text-xl font-bold shadow-lg"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name.charAt(0)}
                  </div>
                  <span className="text-xl font-semibold text-white tracking-tight">{p.name}</span>
                </div>
                {!p.enabled && (
                  <span className="text-xs text-text-tertiary bg-surface-base border border-surface-border px-3 py-1 rounded-full font-medium shadow-inner">
                    Coming soon
                  </span>
                )}
              </div>
              
              <p className="text-sm text-text-secondary leading-relaxed font-light relative z-10">{p.description}</p>

              <div className="mt-auto pt-2 relative z-10">
                {isConnected ? (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <span className="flex-1 w-full flex items-center justify-center gap-2 text-sm px-4 py-3 rounded-2xl font-medium bg-status-success/10 text-status-success border border-status-success/20 truncate">
                      <span className="shrink-0">✓</span> Connected
                    </span>
                    <button
                      onClick={() => handleOtherDisconnect(p.id)}
                      disabled={isBusy}
                      className="w-full sm:w-auto text-sm px-5 py-3 bg-surface-base hover:bg-status-error/10 text-text-secondary hover:text-status-error border border-surface-border rounded-2xl font-medium transition-all disabled:opacity-40"
                    >
                      {isBusy ? "…" : "Disconnect"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => p.enabled && handleOtherConnect(p.id)}
                    disabled={!p.enabled || isBusy}
                    className={`w-full text-sm px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      p.enabled
                        ? "bg-surface-elevated text-white hover:bg-white/10 border border-surface-border cursor-pointer shadow-lg hover:shadow-xl"
                        : "bg-surface-base text-text-tertiary border border-surface-border cursor-not-allowed"
                    }`}
                  >
                    {isBusy && (
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    )}
                    {isBusy ? "Connecting…" : p.enabled ? "Connect Account" : "Not Available"}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
