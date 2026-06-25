import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import ConnectClient from "@/components/ConnectClient"

export default async function ConnectPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <main className="max-w-2xl mx-auto pt-24 px-4 pb-16 animate-fade-in w-full min-h-screen flex flex-col justify-center">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">Connect your platforms</h1>
          <p className="text-sm text-white/70 mt-1">
            Signal scores every imported post for authenticity and shows exactly why you&apos;re seeing it — no hidden algorithm, ever.
          </p>
        </div>
      </div>

      {/* Suspense required because ConnectClient uses useSearchParams() */}
      <Suspense fallback={
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass-panel rounded-3xl p-6 h-44 animate-pulse" />
            ))}
          </div>
        </div>
      }>
        <ConnectClient />
      </Suspense>
    </main>
  )
}
