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
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const links = [
    { href: "/feed", label: "Feed" },
    { href: "/explore", label: "Explore" },
    { href: "/discover", label: "Discover" },
    { href: "/connect", label: "Connect" },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-sm border-b border-border-app h-16 flex items-center px-4 sm:px-6 transition-all duration-300">
      {/* Logo */}
      <div className="flex items-center gap-2.5 flex-1">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-accent-soft">
          <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 20A16 16 0 0 1 20 4" />
            <path d="M4 15A11 11 0 0 1 15 4" />
            <path d="M4 10A6 6 0 0 1 10 4" />
            <circle cx="4" cy="4" r="1.5" fill="currentColor" />
          </svg>
        </div>
        <span className="font-semibold text-lg tracking-tight text-text-primary">Signal</span>
      </div>

      {/* Desktop nav links — hidden on mobile */}
      <div className="hidden sm:flex items-center gap-6">
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm transition-colors duration-200 ${
              pathname === l.href ? "text-accent font-medium" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {l.label}
          </Link>
        ))}

        <Link
          href="/compose"
          className="flex items-center gap-1 bg-accent hover:bg-accent-hover text-white text-sm px-4 py-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
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
                <img src={session.user.image} alt="avatar" className="w-8 h-8 rounded-full border border-border-app" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-surface-secondary" />
              )}
            </button>

            {menuOpen && (
              <>
                <button className="fixed inset-0 z-40 cursor-default" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
                <div className="absolute right-0 mt-2 w-52 bg-surface border border-border-app rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border-app">
                    <p className="text-sm font-medium text-text-primary truncate">{session.user.name}</p>
                    <p className="text-xs text-text-tertiary truncate">{session.user.email}</p>
                  </div>
                  <Link href="/connect" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-secondary transition-colors">
                    Connect platforms
                  </Link>
                  <button onClick={() => signOut({ callbackUrl: "/login" })} className="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile right-side controls */}
      <div className="flex sm:hidden items-center gap-2">
        <ThemeToggle />
        {/* Hamburger button */}
        <button
          aria-label="Toggle navigation menu"
          aria-expanded={mobileNavOpen}
          onClick={() => setMobileNavOpen(v => !v)}
          className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
        >
          <span className={`block w-5 h-0.5 bg-text-primary rounded transition-all duration-200 ${mobileNavOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block w-5 h-0.5 bg-text-primary rounded transition-all duration-200 ${mobileNavOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-text-primary rounded transition-all duration-200 ${mobileNavOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileNavOpen && (
        <>
          <button
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation menu"
          />
          <div className="absolute top-16 left-0 right-0 bg-surface border-b border-border-app shadow-lg z-50 py-3 flex flex-col sm:hidden">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileNavOpen(false)}
                className={`px-6 py-3 text-sm transition-colors duration-200 ${
                  pathname === l.href ? "text-accent font-semibold bg-accent-soft" : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="px-6 pt-2 pb-1 border-t border-border-app mt-2">
              <Link
                href="/compose"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center justify-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-sm px-4 py-2.5 rounded-full transition-all duration-200 w-full"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Post
              </Link>
            </div>
            {session?.user && (
              <div className="px-6 pt-3 pb-2 border-t border-border-app mt-1">
                <p className="text-sm font-medium text-text-primary truncate">{session.user.name}</p>
                <p className="text-xs text-text-tertiary truncate mb-2">{session.user.email}</p>
                <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-xs text-red-500 hover:underline">
                  Log out
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </nav>
  )
}
