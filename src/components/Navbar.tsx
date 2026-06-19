"use client"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const isFeedActive = pathname === "/feed"
  const isExploreActive = pathname === "/explore"

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-100 h-16 flex items-center px-6 transition-all duration-300">
      <div className="flex items-center gap-2.5 flex-1">
        {/* Stylized Signal Wave SVG Logo */}
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50">
          <svg className="w-5 h-5 text-[#2563EB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 20A16 16 0 0 1 20 4" />
            <path d="M4 15A11 11 0 0 1 15 4" />
            <path d="M4 10A6 6 0 0 1 10 4" />
            <circle cx="4" cy="4" r="1.5" fill="currentColor" />
          </svg>
        </div>
        <span className="font-semibold text-lg tracking-tight text-[#0F172A]">Signal</span>
      </div>
      <div className="flex items-center gap-6">
        <Link
          href="/feed"
          className={`text-sm transition-colors duration-200 ${
            isFeedActive
              ? "text-blue-600 font-medium"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Feed
        </Link>
        <Link
          href="/explore"
          className={`text-sm transition-colors duration-200 ${
            isExploreActive
              ? "text-blue-600 font-medium"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Explore
        </Link>
        <Link
          href="/compose"
          className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm px-4 py-2 rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm shadow-blue-500/10 hover:shadow-md active:scale-95"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Post
        </Link>
        {session?.user?.image && (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="focus:outline-none hover:opacity-85 transition-opacity"
            title="Sign out"
          >
            <img src={session.user.image} alt="avatar" className="w-8 h-8 rounded-full border border-slate-200" />
          </button>
        )}
      </div>
    </nav>
  )
}
