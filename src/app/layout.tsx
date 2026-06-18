import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import SessionProvider from "@/components/SessionProvider"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Signal — Trust-native social",
  description: "Social media built on trust, not attention",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-50 text-gray-900 antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
