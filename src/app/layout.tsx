import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import SessionProvider from "@/components/SessionProvider"
import AmbientBackground from "@/components/AmbientBackground"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Signal — Trust-native social",
  description: "Social media built on trust, not attention",
}

/**
 * Inline script that runs before first paint to apply the correct dark/light
 * class on <html>, eliminating any theme flicker on page load.
 * Uses localStorage('signal-theme') with OS-preference fallback.
 */
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('signal-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  } catch (_) {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Inline script runs synchronously before any paint — no flicker */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geist.className} bg-app text-text-primary antialiased`}>
        {/* Persistent ambient Three.js background — renders behind all content */}
        <AmbientBackground />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
