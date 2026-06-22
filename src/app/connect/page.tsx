import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import ConnectClient from "@/components/ConnectClient"

export default async function ConnectPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-app">
      <Navbar />
      <main className="max-w-2xl mx-auto pt-20 px-4 pb-10">
        <div className="mt-6 mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Connect your platforms</h1>
          <p className="text-xs text-text-tertiary mt-2">
            Signal scores every imported post for authenticity and shows exactly why you're seeing it — no hidden algorithm, ever.
          </p>
        </div>
        {/* Suspense required because ConnectClient uses useSearchParams() */}
        <Suspense fallback={null}>
          <ConnectClient />
        </Suspense>
      </main>
    </div>
  )
}
