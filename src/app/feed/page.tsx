import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import FeedClient from "@/components/FeedClient"
import AlgoPanel from "@/components/AlgoPanel"

export default async function FeedPage() {
  const session = await auth()
  if (!session) redirect("/login")
  const userId = (session.user as { id?: string }).id ?? ""

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto pt-20 px-4 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-medium text-gray-900">Your feed</h1>
              <span className="text-xs text-gray-400">Ranked by trust · human-verified</span>
            </div>
            <FeedClient currentUserId={userId} />
          </div>
          <div className="lg:col-span-1">
            <AlgoPanel />
          </div>
        </div>
      </main>
    </div>
  )
}
