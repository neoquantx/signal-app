import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import ExploreClient from "@/components/ExploreClient"

export default async function ExplorePage() {
  const session = await auth()
  if (!session) redirect("/login")
  const userId = (session.user as { id?: string }).id ?? ""

  return (
    <div className="min-h-screen bg-app">
      <Navbar />
      <main className="max-w-2xl mx-auto pt-24 px-4 pb-16 animate-fade-in">
        <div className="flex items-center justify-between mt-6 mb-5 gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">Explore people</h1>
            <p className="text-xs text-text-tertiary mt-0.5">Trust people on specific topics to build your network</p>
          </div>
          <span className="text-xs font-semibold text-accent bg-accent-soft px-3 py-1 rounded-full border border-accent/20 shadow-sm">
            Verified Directory
          </span>
        </div>
        <ExploreClient currentUserId={userId} />
      </main>
    </div>
  )
}
