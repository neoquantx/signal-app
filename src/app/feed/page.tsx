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
    <>
      <Navbar />
      <main className="flex-1 pb-20 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8 items-start justify-center">
          <div className="flex-1 w-full max-w-2xl mx-auto lg:mx-0 space-y-6">
            <FeedClient currentUserId={userId} />
          </div>
          <div className="w-full lg:w-80 space-y-6 hidden lg:block sticky top-24">
            <AlgoPanel />
          </div>
        </div>
      </main>
    </>
  )
}
