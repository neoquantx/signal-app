import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import ExploreClient from "@/components/ExploreClient"

export default async function ExplorePage() {
  const session = await auth()
  if (!session) redirect("/login")
  const userId = (session.user as { id?: string }).id ?? ""

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto pt-24 px-4 pb-16 animate-fade-in w-full">
        <ExploreClient currentUserId={userId} />
      </main>
    </>
  )
}
