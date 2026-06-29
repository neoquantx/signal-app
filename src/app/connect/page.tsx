import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import ConnectClient from "@/components/ConnectClient"

export default async function ConnectPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto pt-24 px-4 pb-16 animate-fade-in w-full min-h-screen flex flex-col">
        {/* Suspense required because ConnectClient uses useSearchParams() */}
        <Suspense fallback={
          <div className="space-y-6 pt-16 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="glass-panel rounded-3xl p-7 h-48 animate-pulse bg-surface-elevated border border-surface-border" />
              ))}
            </div>
          </div>
        }>
          <ConnectClient />
        </Suspense>
      </main>
    </>
  )
}
