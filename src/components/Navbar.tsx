"use client"
import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import ThemeToggle from "@/components/ThemeToggle"

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [
    { href: "/feed", label: "Feed" },
    { href: "/explore", label: "Explore" },
    { href: "/discover", label: "Discover" },
    { href: "/connect", label: "Connect" },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-100 h-16 flex items-center px-6 transition-all duration-300">
      <div className="flex items-center gap-2.5 flex-1">
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
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm transition-colors duration-200 ${
              pathname === l.href ? "text-blue-600 font-medium" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {l.label}
          </Link>
        ))}

        <Link
          href="/compose"
          className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm px-4 py-2 rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm shadow-blue-500/10 hover:shadow-md active:scale-95"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Post
        </Link>

        <ThemeToggle />

        {session?.user && (
          <div className="relative">
            <button onClick={() => setMenuOpen(v => !v)} className="focus:outline-none hover:opacity-85 transition-opacity">
              {session.user.image ? (
                <img src={session.user.image} alt="avatar" className="w-8 h-8 rounded-full border border-slate-200" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200" />
              )}
            </button>

            {menuOpen && (
              <>
                <button className="fixed inset-0 z-40 cursor-default" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
                <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-100 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-900 truncate">{session.user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
                  </div>
                  <Link href="/connect" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                    Connect platforms
                  </Link>
                  <button onClick={() => signOut({ callbackUrl: "/login" })} className="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
