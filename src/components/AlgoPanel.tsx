"use client"
import { useEffect, useState } from "react"
import { Settings2, CheckCircle2 } from "lucide-react"

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
    <>
      <div className="glass-panel p-5 mb-6">
        <p className="text-text-primary leading-relaxed text-[15px]">
          {prefs.trustChainWeight}% of your feed comes from people you trust directly, {prefs.topicRelevanceWeight}% matches topics you follow, and {prefs.recencyWeight}% favors what&apos;s recent.
        </p>
      </div>

      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-2xl tracking-wide text-text-primary">Your Algorithm</h2>
          <Settings2 className="w-5 h-5 text-text-secondary" />
        </div>
        <p className="text-text-secondary text-sm mb-6 leading-relaxed">
          You control what you see. Adjust the weights to shape your feed.
        </p>

        <div className="space-y-5">
          <SliderRow
            label="Trust chain weight"
            value={prefs.trustChainWeight}
            onChange={v => handleChange("trustChainWeight", v)}
          />
          <SliderRow
            label="Topic relevance weight"
            value={prefs.topicRelevanceWeight}
            onChange={v => handleChange("topicRelevanceWeight", v)}
          />
          <SliderRow
            label="Recency weight"
            value={prefs.recencyWeight}
            onChange={v => handleChange("recencyWeight", v)}
          />
        </div>

        {total !== 100 && (
          <p className="text-xs text-status-error bg-status-error/10 border border-status-error/30 rounded-xl px-3 py-2.5 mt-5 font-medium animate-fadeIn">
            Weights add up to {total}% — adjust to reach 100%
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || total !== 100}
          className="w-full mt-6 btn-primary py-3 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
        >
          {saving ? "Saving..." : saved ? "✓ Saved" : "Save algorithm"}
        </button>

        <div className="mt-6 pt-5 border-t border-surface-border">
          <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-3">Algorithm promise</p>
          <div className="space-y-2.5">
            {["No ads, ever", "No paid amplification", "No rage-bait signals", "No hidden ranking"].map(p => (
              <div key={p} className="flex items-center gap-2 text-xs text-text-primary">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary" />
                <span className="font-medium">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function SliderRow({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-2 text-text-primary">
        <span>{label}</span>
        <span className="font-semibold tabular-nums">{value}%</span>
      </div>
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-surface-border rounded-lg appearance-none cursor-pointer accent-brand-primary"
      />
    </div>
  )
}
