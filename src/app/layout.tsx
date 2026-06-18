import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import SessionProvider from "@/components/SessionProvider"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Signal — Trust-native social",
  description:
    "A social feed built on trust, not attention. Every post shows a Human Authenticity Score and a transparent reason for why you see it.",
}

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} bg-background`}>
      <body className="font-sans bg-background text-foreground antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
