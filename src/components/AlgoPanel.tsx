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
      <div className="glass-panel rounded-2xl p-5 shadow-sm mb-6">
        <p className="text-white/90 leading-relaxed text-[15px]">
          {prefs.trustChainWeight}% of your feed comes from people you trust directly, {prefs.topicRelevanceWeight}% matches topics you follow, and {prefs.recencyWeight}% favors what&apos;s recent.
        </p>
      </div>

      <div className="dark-glass-panel rounded-2xl p-6 text-accent-cream shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-2xl tracking-wide">Your Algorithm</h2>
          <Settings2 className="w-5 h-5 text-white/70" />
        </div>
        <p className="text-white/80 text-sm mb-6 leading-relaxed">
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
          <p className="text-xs text-yellow-300 bg-yellow-900/40 border border-yellow-500/30 rounded-xl px-3 py-2.5 mt-5 font-medium animate-fadeIn">
            Weights add up to {total}% — adjust to reach 100%
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || total !== 100}
          className="w-full mt-6 bg-accent-green hover:bg-opacity-90 text-white text-sm py-3 rounded-full font-semibold disabled:opacity-40 transition-all cursor-pointer shadow-md"
        >
          {saving ? "Saving..." : saved ? "✓ Saved" : "Save algorithm"}
        </button>

        <div className="mt-6 pt-5 border-t border-white/10">
          <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest mb-3">Algorithm promise</p>
          <div className="space-y-2.5">
            {["No ads, ever", "No paid amplification", "No rage-bait signals", "No hidden ranking"].map(p => (
              <div key={p} className="flex items-center gap-2 text-xs text-white/80">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />
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
      <div className="flex justify-between text-xs mb-2 text-white/90">
        <span>{label}</span>
        <span className="font-semibold tabular-nums">{value}%</span>
      </div>
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
      />
    </div>
  )
}
