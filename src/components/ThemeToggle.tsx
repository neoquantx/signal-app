"use client"

import { useEffect, useState } from "react"

/**
 * ThemeToggle
 * - On mount reads localStorage('signal-theme'); falls back to OS preference.
 * - Toggles the `dark` class on <html> and persists to localStorage.
 * - Uses a `mounted` guard to avoid SSR/hydration mismatch.
 * - The inline <script> in layout.tsx handles the initial class assignment
 *   before paint, so this component just reflects the current state.
 */
export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)

  // Read the applied class after mount (set by the inline script in layout.tsx)
  useEffect(() => {
    const isDarkTheme = document.documentElement.classList.contains("dark")
    setTimeout(() => {
      setMounted(true)
      setIsDark(isDarkTheme)
    }, 0)
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("signal-theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("signal-theme", "light")
    }
  }

  // Render an invisible placeholder during SSR to avoid layout shift
  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className="w-9 h-9 rounded-xl opacity-0 pointer-events-none"
        tabIndex={-1}
      />
    )
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`
        relative w-9 h-9 flex items-center justify-center rounded-xl
        border border-border-app bg-surface
        hover:bg-surface-secondary hover:border-border-strong
        text-text-secondary hover:text-text-primary
        transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
        active:scale-95
      `}
    >
      {/* Sun icon */}
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-300"
        style={{
          opacity: isDark ? 1 : 0,
          transform: isDark ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.5)",
        }}
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      </span>

      {/* Moon icon */}
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-300"
        style={{
          opacity: isDark ? 0 : 1,
          transform: isDark ? "rotate(90deg) scale(0.5)" : "rotate(0deg) scale(1)",
        }}
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>
    </button>
  )
}
