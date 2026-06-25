"use client"

import { useRef, useCallback, useEffect, useState } from "react"

interface TiltCardProps {
  children: React.ReactNode
  className?: string
  /** Maximum tilt angle in degrees (default: 9) */
  maxTilt?: number
}

/**
 * TiltCard
 * A reusable wrapper that applies a subtle GPU-composited 3D tilt effect
 * using CSS perspective + rotateX/rotateY transforms.
 *
 * - Max tilt: ~9 degrees (premium, not gimmicky)
 * - Eases back to flat on mouse leave with 0.4s ease-out
 * - Fully disabled (children rendered without transform) when
 *   `prefers-reduced-motion: reduce` matches
 * - Only animates `transform` and `opacity` (GPU-composited, zero layout thrash)
 */
export default function TiltCard({
  children,
  className = "",
  maxTilt = 9,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    }
    return false
  })

  // Check for reduced-motion preference once on mount
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const applyTilt = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reducedMotion) return
      const card = cardRef.current
      if (!card) return

      const { left, top, width, height } = card.getBoundingClientRect()
      // Normalised coordinates: -1 to +1
      const nx = ((e.clientX - left) / width - 0.5) * 2
      const ny = ((e.clientY - top) / height - 0.5) * 2

      const rotateY = nx * maxTilt
      const rotateX = -ny * maxTilt

      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
        card.style.transition = "transform 0.08s linear"
      })
    },
    [reducedMotion, maxTilt]
  )

  const resetTilt = useCallback(() => {
    if (reducedMotion) return
    const card = cardRef.current
    if (!card) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)"
      card.style.transition = "transform 0.4s ease-out"
    })
  }, [reducedMotion])

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      ref={cardRef}
      onMouseMove={applyTilt}
      onMouseLeave={resetTilt}
      className={className}
      style={{
        willChange: reducedMotion ? "auto" : "transform",
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </div>
  )
}
