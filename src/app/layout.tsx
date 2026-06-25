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
      <body className="min-h-screen bg-black text-on-surface antialiased overflow-x-hidden">
        {/* Background Video Container */}
        <div className="fixed inset-0 z-0">
          <video autoPlay className="absolute inset-0 w-full h-full object-cover" loop muted playsInline>
            <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4" type="video/mp4"/>
          </video>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
        </div>
        
        {/* UI Content Foreground Container */}
        <div className="relative z-10 flex flex-col min-h-screen w-full">
          <SessionProvider>
            {children}
          </SessionProvider>
        </div>
      </body>
    </html>
  )
}
