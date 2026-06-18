import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/Sidebar"
import TrendingClient from "@/components/TrendingClient"

export default async function TrendingPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1200px] gap-0 lg:gap-8">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 py-6 lg:max-w-[640px] lg:px-0 lg:py-8">
        <div className="mb-5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Trending</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Topics ranked by genuine human activity</p>
        </div>
        <TrendingClient />
      </main>
    </div>
  )
}
