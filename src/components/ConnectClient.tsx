"use client"
import { useEffect, useRef, useState } from "react"
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
    if (error === "access_denied") {
      setOauthError("Bluesky connection was cancelled or denied. Try again below.")
    } else if (desc) {
      setOauthError(`Bluesky connection failed: ${decodeURIComponent(desc)}`)
    } else {
      setOauthError(`Bluesky connection failed (${error}). Try again below.`)
    }

    // Clean the URL so a refresh doesn't re-show the banner
    const clean = new URL(window.location.href)
    clean.searchParams.delete("error")
    clean.searchParams.delete("desc")
    window.history.replaceState({}, "", clean.toString())
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
  async function handleOtherConnect(platformId: string) {
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
  }

  // ---- Other platforms: disconnect (cosmetic) ----
  async function handleOtherDisconnect(platformId: string) {
    setBusyOther(platformId)
    await fetch("/api/users/connect-platform", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: platformId }),
    })
    setConnectedOther(prev => prev.filter(p => p !== platformId))
    setBusyOther(null)
  }

  // ---- Render ----
  return (
    <div className="max-w-2xl">
      {/* OAuth error banner — semantic red preserved */}
      {oauthError && (
        <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-red-500 mt-0.5 shrink-0">⚠️</span>
          <p className="text-xs text-red-700 flex-1">{oauthError}</p>
          <button
            onClick={() => setOauthError(null)}
            className="text-red-400 hover:text-red-600 text-sm leading-none shrink-0"
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
                className="bg-surface rounded-2xl border border-border-app p-5 flex flex-col gap-3"
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
                    <span className="text-sm font-medium text-text-primary">Bluesky</span>
                  </div>
                </div>

                <p className="text-xs text-text-secondary">{p.description}</p>

                {/* Connected state — semantic green preserved */}
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-xs px-3 py-2 rounded-full font-medium bg-green-50 text-green-700 border border-green-200 truncate">
                      ✓ Connected as @{bskyStatus!.handle}
                    </span>
                    <button
                      onClick={handleBlueskyDisconnect}
                      disabled={isBusy}
                      className="text-xs px-3 py-2 rounded-full font-medium text-text-tertiary hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 shrink-0"
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
                            className="flex-1 text-xs px-3 py-2 rounded-full border border-border-app bg-surface text-text-primary placeholder-text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                          />
                          <button
                            type="submit"
                            className="text-xs px-4 py-2 rounded-full font-medium bg-accent text-white hover:bg-accent-hover transition-colors shrink-0"
                          >
                            Go
                          </button>
                        </div>
                        {handleError && (
                          <p className="text-xs text-red-500 px-1">{handleError}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => { setShowHandleInput(false); setHandleError(null) }}
                          className="text-xs text-text-tertiary hover:text-text-secondary self-start px-1"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      /* Initial connect button */
                      <button
                        onClick={handleBlueskyConnect}
                        disabled={isLoading}
                        className="text-xs px-3 py-2 rounded-full font-medium bg-accent text-white hover:bg-accent-hover transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
              className={`bg-surface rounded-2xl border p-5 flex flex-col gap-3 ${
                p.enabled ? "border-border-app" : "border-border-app opacity-60"
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
                  <span className="text-sm font-medium text-text-primary">{p.name}</span>
                </div>
                {!p.enabled && (
                  <span className="text-xs text-text-tertiary bg-surface-secondary px-2 py-0.5 rounded-full">
                    Coming soon
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary">{p.description}</p>

              {isConnected ? (
                <div className="flex items-center gap-2">
                  {/* Connected state — semantic green preserved */}
                  <span className="flex-1 text-xs px-3 py-2 rounded-full font-medium bg-green-50 text-green-600 border border-green-200 text-center">
                    ✓ Connected
                  </span>
                  <button
                    onClick={() => handleOtherDisconnect(p.id)}
                    disabled={isBusy}
                    className="text-xs px-3 py-2 rounded-full font-medium text-text-tertiary hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    {isBusy ? "…" : "Disconnect"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => p.enabled && handleOtherConnect(p.id)}
                  disabled={!p.enabled || isBusy}
                  className={`text-xs px-3 py-2 rounded-full font-medium transition-all flex items-center justify-center gap-2 ${
                    p.enabled
                      ? "bg-accent text-white hover:bg-accent-hover"
                      : "bg-surface-secondary text-text-tertiary cursor-not-allowed"
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
        className="mt-6 text-xs text-text-tertiary hover:text-text-secondary"
      >
        Skip for now → go to feed
      </button>
    </div>
  )
}
