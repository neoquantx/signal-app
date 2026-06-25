"use client"
import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Compass, Plus, Menu, X, LogOut } from "lucide-react"

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const links = [
    { href: "/feed", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Search },
    { href: "/discover", label: "Discover", icon: Compass },
  ]

  return (
    <header className="glass-panel sticky top-0 z-50 border-b border-white/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent-green flex items-center justify-center text-accent-cream font-serif text-xl border border-white/10">S</div>
          <span className="font-serif text-2xl text-accent-green tracking-wide">Signal</span>
        </div>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => {
            const Icon = l.icon
            const isActive = pathname === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`font-medium flex items-center gap-2 transition-colors px-2 ${
                  isActive
                    ? "bg-black text-white px-4 py-1.5 rounded-full font-semibold shadow-sm"
                    : "text-on-surface/70 hover:text-on-surface"
                }`}
              >
                <Icon className={isActive ? "w-5 h-5" : "w-5 h-5"} /> {l.label}
              </Link>
            )
          })}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          <Link
            href="/compose"
            className="hidden sm:flex bg-black text-white px-4 py-1.5 rounded-full font-medium text-sm hover:bg-opacity-90 active:scale-95 transition-all shadow-md items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Post
          </Link>

          {session?.user && (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-10 h-10 rounded-full bg-accent-green text-accent-cream flex items-center justify-center font-medium overflow-hidden border-2 border-white/20 cursor-pointer hover:ring-2 hover:ring-white/20 hover:ring-offset-2 transition-all focus:outline-none"
              >
                {session.user.image ? (
                  <img src={session.user.image} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">{session.user.name?.[0]?.toUpperCase() || "U"}</span>
                )}
              </button>

              {menuOpen && (
                <>
                  <button className="fixed inset-0 z-40 cursor-default" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden text-on-surface">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium truncate">{session.user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            aria-label="Toggle navigation menu"
            onClick={() => setMobileNavOpen((v) => !v)}
            className="sm:hidden w-10 h-10 flex items-center justify-center text-on-surface hover:bg-black/5 rounded-full transition-colors"
          >
            {mobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileNavOpen && (
        <>
          <button
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation menu"
          />
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-xl z-50 py-3 flex flex-col sm:hidden text-on-surface">
            {links.map((l) => {
              const Icon = l.icon
              const isActive = pathname === l.href
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`px-6 py-3 text-sm transition-colors duration-200 flex items-center gap-3 ${
                    isActive ? "text-accent-green font-semibold bg-green-50" : "text-gray-600 hover:text-black hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" /> {l.label}
                </Link>
              )
            })}
            <div className="px-6 pt-3 pb-1 border-t border-gray-100 mt-2">
              <Link
                href="/compose"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center justify-center gap-1.5 bg-black hover:bg-opacity-90 text-white text-sm px-4 py-2.5 rounded-full transition-all duration-200 w-full"
              >
                <Plus className="w-4 h-4" /> New Post
              </Link>
            </div>
            {session?.user && (
              <div className="px-6 pt-3 pb-2 border-t border-gray-100 mt-2">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 rounded-full bg-accent-green text-accent-cream flex items-center justify-center font-medium overflow-hidden">
                    {session.user.image ? (
                      <img src={session.user.image} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">{session.user.name?.[0]?.toUpperCase() || "U"}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black truncate">{session.user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  )
}
