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
    <div className="min-h-screen bg-app">
      <Navbar />
      {/*
        Task 4: grid stacks on mobile — feed first, algo panel below.
        On lg+ it shows side-by-side: [feed | 300px algo panel].
      */}
      <main className="max-w-5xl mx-auto pt-24 px-4 pb-16 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 mt-6">
          <div>
            <FeedClient currentUserId={userId} />
          </div>
          <div className="relative">
            <AlgoPanel />
          </div>
        </div>
      </main>
    </div>
  )
}
