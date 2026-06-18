"use client"
import { useEffect, useState } from "react"
import { Sparkles, Check } from "lucide-react"

interface Prefs {
  trustChainWeight: number
  topicRelevanceWeight: number
  recencyWeight: number
}

const PROMISES = ["No ads, ever", "No paid amplification", "No rage-bait signals", "No hidden ranking"]

export default function AlgoPanel() {
  const [prefs, setPrefs] = useState<Prefs>({ trustChainWeight: 65, topicRelevanceWeight: 25, recencyWeight: 10 })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/algo")
      .then((r) => r.json())
      .then((d) => {
        if (d.prefs) setPrefs(d.prefs)
      })
  }, [])

  function handleChange(key: keyof Prefs, val: number) {
    setPrefs((prev) => ({ ...prev, [key]: val }))
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
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-4 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <h2 className="text-sm font-semibold">Your algorithm</h2>
        </div>
        <p className="mt-0.5 text-xs text-blue-100">100% transparent · yours to control</p>
      </div>

      <div className="px-5 py-5">
        {/* Sliders */}
        <div className="space-y-5">
          <SliderRow
            label="Trust chain"
            value={prefs.trustChainWeight}
            onChange={(v) => handleChange("trustChainWeight", v)}
            colorClass="text-blue-600"
            track="#2563eb"
          />
          <SliderRow
            label="Topic relevance"
            value={prefs.topicRelevanceWeight}
            onChange={(v) => handleChange("topicRelevanceWeight", v)}
            colorClass="text-purple-600"
            track="#9333ea"
          />
          <SliderRow
            label="Recency"
            value={prefs.recencyWeight}
            onChange={(v) => handleChange("recencyWeight", v)}
            colorClass="text-green-600"
            track="#16a34a"
          />
        </div>

        {total !== 100 && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-suspicious">
            Weights total {total}% — adjust to reach 100%.
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || total !== 100}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Saving…" : saved ? (<><Check className="h-4 w-4" /> Saved</>) : "Save algorithm"}
        </button>

        {/* Promise */}
        <div className="mt-5 border-t border-border pt-5">
          <p className="mb-3 text-xs font-semibold text-foreground">Algorithm promise</p>
          <div className="space-y-2">
            {PROMISES.map((p) => (
              <div key={p} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-2.5 w-2.5 text-verified" strokeWidth={3} />
                </span>
                {p}
              </div>
            ))}
          </div>
        </div>

        {/* Feed health */}
        <div className="mt-5 border-t border-border pt-5">
          <p className="mb-3 text-xs font-semibold text-foreground">Feed health</p>
          <HealthBar label="Human content" value={94} track="#2563eb" />
          <HealthBar label="Topic diversity" value={72} track="#9333ea" />
          <HealthBar label="New voices" value={31} track="#16a34a" />
        </div>
      </div>
    </div>
  )
}

function SliderRow({
  label,
  value,
  onChange,
  colorClass,
  track,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  colorClass: string
  track: string
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className={`text-xs font-semibold ${colorClass}`}>{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`signal-slider w-full ${colorClass}`}
        style={{
          background: `linear-gradient(to right, ${track} 0%, ${track} ${value}%, #e2e8f0 ${value}%, #e2e8f0 100%)`,
        }}
      />
    </div>
  )
}

function HealthBar({ label, value, track }: { label: string; value: number; track: string }) {
  return (
    <div className="mb-2.5 flex items-center gap-2.5">
      <span className="w-24 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: track }} />
      </div>
      <span className="w-8 text-right text-xs font-medium text-foreground tabular-nums">{value}%</span>
    </div>
  )
}
