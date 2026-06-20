import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import ConnectClient from "@/components/ConnectClient"

export default async function ConnectPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto pt-20 px-4 pb-10">
        <div className="mt-6 mb-6">
          <h1 className="text-lg font-medium text-gray-900">Connect your platforms</h1>
          <p className="text-xs text-gray-400 mt-1">
            Signal scores every imported post for authenticity and shows exactly why you're seeing it — no hidden algorithm, ever.
          </p>
        </div>
        <ConnectClient />
      </main>
    </div>
  )
}
