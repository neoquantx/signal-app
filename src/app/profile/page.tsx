import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/Sidebar"
import ProfileClient from "@/components/ProfileClient"

export default async function ProfilePage() {
  const session = await auth()
  if (!session) redirect("/login")
  const user = session.user as { id?: string; name?: string; image?: string }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1200px] gap-0 lg:gap-8">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 py-6 lg:max-w-[640px] lg:px-0 lg:py-8">
        <ProfileClient userId={user.id ?? ""} name={user.name ?? "You"} image={user.image} />
      </main>
    </div>
  )
}
