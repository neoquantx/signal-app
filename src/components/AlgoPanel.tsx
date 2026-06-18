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
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
        </div>
        <h2 className="text-sm font-medium text-gray-900">Your algorithm</h2>
      </div>
      <p className="text-xs text-gray-400 mb-5">100% transparent. Yours to control.</p>

      <div className="space-y-5">
        <SliderRow
          label="Trust chain weight"
          value={prefs.trustChainWeight}
          onChange={v => handleChange("trustChainWeight", v)}
          color="bg-blue-500"
        />
        <SliderRow
          label="Topic relevance"
          value={prefs.topicRelevanceWeight}
          onChange={v => handleChange("topicRelevanceWeight", v)}
          color="bg-purple-500"
        />
        <SliderRow
          label="Recency"
          value={prefs.recencyWeight}
          onChange={v => handleChange("recencyWeight", v)}
          color="bg-green-500"
        />
      </div>

      {total !== 100 && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-4">
          Weights add up to {total}% — adjust to reach 100%
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving || total !== 100}
        className="w-full mt-4 bg-blue-600 text-white text-xs py-2 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all"
      >
        {saving ? "Saving..." : saved ? "✓ Saved" : "Save algorithm"}
      </button>

      <div className="mt-5 pt-5 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-500 mb-3">Algorithm promise</p>
        <div className="space-y-2">
          {["No ads, ever", "No paid amplification", "No rage-bait signals", "No hidden ranking"].map(p => (
            <div key={p} className="flex items-center gap-2 text-xs text-gray-500">
              <span className="text-green-500">✓</span> {p}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-500 mb-3">Feed health this week</p>
        <HealthBar label="Human content" value={94} color="bg-blue-500" />
        <HealthBar label="Topic diversity" value={72} color="bg-purple-500" />
        <HealthBar label="New voices" value={31} color="bg-orange-400" />
      </div>
    </div>
  )
}

function SliderRow({ label, value, onChange, color }: {
  label: string; value: number; onChange: (v: number) => void; color: string
}) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs font-medium text-gray-900">{value}%</span>
      </div>
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer accent-blue-600"
      />
    </div>
  )
}

function HealthBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs text-gray-400 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{value}%</span>
    </div>
  )
}
