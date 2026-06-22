"use client"
import { useEffect, useState } from "react"

interface Prefs {
  trustChainWeight: number
  topicRelevanceWeight: number
  recencyWeight: number
}

export default function AlgoPanel() {
  const [prefs, setPrefs] = useState<Prefs>({ trustChainWeight: 65, topicRelevanceWeight: 25, recencyWeight: 10 })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/algo").then(r => r.json()).then(d => {
      if (d.prefs) setPrefs(d.prefs)
    })
  }, [])

  async function handleChange(key: keyof Prefs, val: number) {
    setPrefs(prev => ({ ...prev, [key]: val }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    await fetch("/api/algo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const total = prefs.trustChainWeight + prefs.topicRelevanceWeight + prefs.recencyWeight

  return (
    <div className="bg-surface rounded-3xl border border-border-app overflow-hidden shadow-sm sticky top-24">
      {/* Gradient Header — uses brand accent color */}
      <div className="bg-accent text-white p-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
            <svg className="w-3.5 h-3.5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold tracking-tight">Your algorithm</h2>
        </div>
        <p className="text-xs text-white/80 font-normal">100% transparent. Yours to control.</p>
      </div>

      <div className="p-5">
        <div className="bg-surface-secondary border border-border-app rounded-xl p-4 mb-5 shadow-sm">
          <p className="text-sm text-text-primary leading-relaxed font-medium">
            {prefs.trustChainWeight}% of your feed comes from people you trust directly, {prefs.topicRelevanceWeight}% matches topics you follow, and {prefs.recencyWeight}% favors what's recent.
          </p>
        </div>

        <div className="space-y-6">
          <SliderRow
            label="Trust chain weight"
            description="How much comes from people you've trusted"
            value={prefs.trustChainWeight}
            onChange={v => handleChange("trustChainWeight", v)}
            accentColor="accent-[#546B41]"
            trackColor="bg-accent"
          />
          <SliderRow
            label="Topic relevance"
            description="How well it matches your interests"
            value={prefs.topicRelevanceWeight}
            onChange={v => handleChange("topicRelevanceWeight", v)}
            accentColor="accent-[#8B5CF6]"
            trackColor="bg-[#8B5CF6]"
          />
          <SliderRow
            label="Recency"
            description="How recently it was posted"
            value={prefs.recencyWeight}
            onChange={v => handleChange("recencyWeight", v)}
            accentColor="accent-[#10B981]"
            trackColor="bg-[#10B981]"
          />
        </div>

        {total !== 100 && (
          /* Warning stays amber — semantic status color */
          <p className="text-xs text-amber-700 bg-[#FFFBEB] border border-amber-200/50 rounded-xl px-3 py-2.5 mt-4 font-medium animate-fadeIn">
            Weights add up to {total}% — adjust to reach 100%
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || total !== 100}
          className="w-full mt-5 bg-accent hover:bg-accent-hover text-white text-xs py-2.5 rounded-xl font-semibold disabled:opacity-40 transition-all cursor-pointer shadow-sm hover:shadow active:scale-[0.98]"
        >
          {saving ? "Saving..." : saved ? "✓ Saved" : "Save algorithm"}
        </button>

        {/* Algorithm Promise Section */}
        <div className="mt-5 pt-5 border-t border-border-app">
          <p className="text-xs font-bold text-text-secondary mb-3">Algorithm promise</p>
          <div className="space-y-2.5">
            {["No ads, ever", "No paid amplification", "No rage-bait signals", "No hidden ranking"].map(p => (
              <div key={p} className="flex items-center gap-2 text-xs text-text-secondary">
                {/* Success indicator — semantic green preserved */}
                <div className="w-4.5 h-4.5 rounded-full bg-[#F0FDF4] flex items-center justify-center flex-shrink-0 border border-[#16A34A]/10">
                  <svg className="w-2.5 h-2.5 text-[#16A34A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="font-medium">{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Feed Health Section */}
        <div className="mt-5 pt-5 border-t border-border-app">
          <p className="text-xs font-bold text-text-secondary mb-3">Feed health this week</p>
          <HealthBar label="Human content" value={94} color="bg-accent" trend="up" />
          <HealthBar label="Topic diversity" value={72} color="bg-[#8B5CF6]" trend="up" />
          <HealthBar label="New voices" value={31} color="bg-[#F59E0B]" trend="down" />
        </div>
      </div>
    </div>
  )
}

function SliderRow({ label, description, value, onChange, accentColor, trackColor }: {
  label: string; description: string; value: number; onChange: (v: number) => void; accentColor: string; trackColor: string
}) {
  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <span className="text-sm font-semibold text-text-primary">{label}</span>
        <span className="text-sm font-bold text-text-primary">{value}%</span>
      </div>
      <p className="text-xs text-text-tertiary mb-2">{description}</p>
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={`w-full h-1.5 rounded-full appearance-none cursor-pointer ${accentColor} bg-surface-secondary focus:outline-none`}
      />
      {/* Animated visual progress bar */}
      <div className="mt-2 h-1 bg-surface-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${trackColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function HealthBar({ label, value, color, trend }: { label: string; value: number; color: string; trend: "up" | "down" }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span className="text-xs font-medium text-text-secondary w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
      <div className="flex items-center gap-1 w-12 justify-end flex-shrink-0">
        <span className="text-xs font-bold text-text-primary">{value}%</span>
        {/* Trend arrows — semantic green/red preserved */}
        {trend === "up" ? (
          <span className="text-[#16A34A] text-xs font-black flex items-center justify-center w-3.5 h-3.5 rounded bg-[#F0FDF4] border border-[#16A34A]/10" title="Trending up">
            ↑
          </span>
        ) : (
          <span className="text-[#DC2626] text-xs font-black flex items-center justify-center w-3.5 h-3.5 rounded bg-[#FEF2F2] border border-[#DC2626]/10" title="Trending down">
            ↓
          </span>
        )}
      </div>
    </div>
  )
}
