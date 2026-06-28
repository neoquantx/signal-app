"use client"
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Compass, Plus, Menu, X, LogOut, ChevronDown } from "lucide-react"

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const links = [
    { href: "/feed", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Search },
    { href: "/discover", label: "Discover", icon: Compass },
  ]

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 px-4 sm:px-6 lg:px-8 ${scrolled ? 'py-3' : 'py-5'}`}>
      <div className={`max-w-6xl mx-auto flex items-center justify-between transition-all duration-300 ${
        scrolled 
          ? 'glass-panel rounded-full px-6 py-2 shadow-lg' 
          : 'bg-transparent px-2 py-2'
      }`}>
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white font-serif text-xl shadow-lg group-hover:shadow-brand-primary/50 transition-all duration-300 transform group-hover:scale-105">
            S
          </div>
          <span className={`font-serif text-2xl tracking-wide transition-colors ${scrolled ? 'text-white' : 'gradient-text'}`}>Signal</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-glass border border-surface-border rounded-full p-1 shadow-inner">
          {links.map((l) => {
            const Icon = l.icon
            const isActive = pathname === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`font-medium flex items-center gap-2 transition-all duration-300 px-5 py-2 rounded-full ${
                  isActive
                    ? "bg-gradient-to-r from-brand-primary to-brand-accent text-white shadow-md"
                    : "text-text-secondary hover:text-white hover:bg-surface-glass-hover"
                }`}
              >
                <Icon className={isActive ? "w-4 h-4" : "w-4 h-4 opacity-70"} />
                <span className="text-sm">{l.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          <Link
            href="/compose"
            className="hidden sm:flex btn-primary px-5 py-2 rounded-full text-sm items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Post
          </Link>

          {session?.user && (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-surface-border bg-surface-glass hover:bg-surface-glass-hover transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-primary flex items-center justify-center text-white font-medium">
                  {session.user.image ? (
                    <img src={session.user.image} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{session.user.name?.[0]?.toUpperCase() || "U"}</span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <>
                  <button className="fixed inset-0 z-40 cursor-default" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
                  <div className="absolute right-0 mt-3 w-56 glass-panel rounded-2xl shadow-2xl z-50 overflow-hidden text-white border border-surface-border/50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-4 border-b border-surface-border bg-surface-elevated/50">
                      <p className="text-sm font-semibold truncate text-white">{session.user.name}</p>
                      <p className="text-xs text-text-secondary truncate mt-0.5">{session.user.email}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm text-status-error hover:bg-status-error/10 rounded-xl transition-colors font-medium"
                      >
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            aria-label="Toggle navigation menu"
            onClick={() => setMobileNavOpen((v) => !v)}
            className="sm:hidden w-10 h-10 flex items-center justify-center text-white bg-surface-glass border border-surface-border hover:bg-surface-glass-hover rounded-full transition-colors"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileNavOpen && (
        <>
          <button
            className="fixed inset-0 z-40 cursor-default bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation menu"
          />
          <div className="absolute top-[80px] left-4 right-4 glass-panel rounded-3xl shadow-2xl z-50 p-2 flex flex-col sm:hidden border border-surface-border animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col gap-1 p-2">
              {links.map((l) => {
                const Icon = l.icon
                const isActive = pathname === l.href
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={`px-4 py-3.5 text-base font-medium rounded-2xl transition-all duration-200 flex items-center gap-3 ${
                      isActive 
                        ? "bg-gradient-to-r from-brand-primary to-brand-accent text-white shadow-md" 
                        : "text-text-secondary hover:text-white hover:bg-surface-glass"
                    }`}
                  >
                    <Icon className="w-5 h-5" /> {l.label}
                  </Link>
                )
              })}
            </div>
            
            <div className="px-4 py-3 mt-2 border-t border-surface-border">
              <Link
                href="/compose"
                onClick={() => setMobileNavOpen(false)}
                className="btn-primary flex items-center justify-center gap-2 text-white text-sm px-4 py-3.5 rounded-2xl w-full"
              >
                <Plus className="w-5 h-5" /> Create New Post
              </Link>
            </div>
            
            {session?.user && (
              <div className="px-4 py-4 mt-2 border-t border-surface-border bg-surface-elevated/30 rounded-b-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center font-medium overflow-hidden shadow-lg">
                      {session.user.image ? (
                        <img src={session.user.image} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white">{session.user.name?.[0]?.toUpperCase() || "U"}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white truncate max-w-[120px]">{session.user.name}</p>
                      <p className="text-xs text-text-tertiary truncate max-w-[120px]">{session.user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="p-2 text-status-error bg-status-error/10 hover:bg-status-error/20 rounded-full transition-colors"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  )
}
