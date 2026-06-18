import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import ExploreClient from "@/components/ExploreClient"

export default async function ExplorePage() {
  const session = await auth()
  if (!session) redirect("/login")
  const userId = (session.user as { id?: string }).id ?? ""

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto pt-20 px-4 pb-10">
        <div className="flex items-center justify-between mt-6 mb-4">
          <h1 className="text-lg font-medium text-gray-900">Explore people</h1>
          <span className="text-xs text-gray-400">Trust people on specific topics</span>
        </div>
        <ExploreClient currentUserId={userId} />
      </main>
    </div>
  )
}
