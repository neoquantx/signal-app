import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import ExploreClient from "@/components/ExploreClient"

export default async function ExplorePage() {
  const session = await auth()
  if (!session) redirect("/login")
  const userId = (session.user as { id?: string }).id ?? ""

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <main className="max-w-2xl mx-auto pt-24 px-4 pb-16 animate-fade-in">
        <div className="flex items-center justify-between mt-6 mb-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">Explore people</h1>
            <p className="text-xs text-slate-400 mt-0.5">Trust people on specific topics to build your network</p>
          </div>
          <span className="text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-100 shadow-sm shadow-blue-500/5">
            Verified Directory
          </span>
        </div>
        <ExploreClient currentUserId={userId} />
      </main>
    </div>
  )
}
