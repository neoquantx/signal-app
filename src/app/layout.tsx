import type { Metadata } from "next"
import { Inter, Instrument_Serif } from "next/font/google"
import "./globals.css"
import SessionProvider from "@/components/SessionProvider"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-instrument",
})

export const metadata: Metadata = {
  title: "Signal — Trust-native social",
  description: "Social media built on trust, not attention",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable}`}>
      <body className="min-h-screen bg-surface-base text-text-primary antialiased overflow-x-hidden selection:bg-brand-primary/30 selection:text-white">
        <div className="bg-mesh-gradient"></div>
        <div className="flex flex-col min-h-screen w-full relative z-0">
          <SessionProvider>
            {children}
          </SessionProvider>
        </div>
      </body>
    </html>
  )
}
