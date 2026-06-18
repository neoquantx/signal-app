"use client"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 h-14 flex items-center px-6">
      <div className="flex items-center gap-2 flex-1">
        <div className="w-6 h-6 bg-blue-600 rounded-full" />
        <span className="font-medium text-gray-900">Signal</span>
      </div>
      <div className="flex items-center gap-6">
        <Link href="/feed" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Feed</Link>
        <Link href="/explore" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Explore</Link>
        <Link href="/compose" className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-full hover:bg-blue-700 transition-colors">Post</Link>
        {session?.user?.image && (
          <button onClick={() => signOut({ callbackUrl: "/login" })}>
            <img src={session.user.image} alt="avatar" className="w-7 h-7 rounded-full border border-gray-200" />
          </button>
        )}
      </div>
    </nav>
  )
}
