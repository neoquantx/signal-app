import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import DiscoverClient from "@/components/DiscoverClient"

export default async function DiscoverPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-app">
      <Navbar />
      <main className="max-w-6xl mx-auto pt-20 px-4 pb-10">
        <div className="mb-6 mt-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Discover</h1>
          <p className="text-xs text-text-tertiary mt-2">Real posts from the open web, scored for authenticity by Signal</p>
        </div>
        <DiscoverClient />
      </main>
    </div>
  )
}
