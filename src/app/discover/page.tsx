import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import DiscoverClient from "@/components/DiscoverClient"

export default async function DiscoverPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <>
      <Navbar />
      <main className="flex-1 overflow-y-auto pb-20 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DiscoverClient />
        </div>
      </main>
    </>
  )
}
