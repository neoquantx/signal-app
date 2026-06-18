import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/Sidebar"
import FeedClient from "@/components/FeedClient"
import AlgoPanel from "@/components/AlgoPanel"

export default async function FeedPage() {
  const session = await auth()
  if (!session) redirect("/login")
  const userId = (session.user as { id?: string }).id ?? ""

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1200px] gap-0 lg:gap-8">
      <Sidebar />

      {/* Center column */}
      <main className="min-w-0 flex-1 px-4 py-6 lg:max-w-[600px] lg:px-0 lg:py-8">
        <FeedClient currentUserId={userId} />
      </main>

      {/* Right sidebar */}
      <aside className="hidden w-[280px] shrink-0 py-8 xl:block">
        <div className="sticky top-8">
          <AlgoPanel />
        </div>
      </aside>
    </div>
  )
}
