"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Home, Compass, TrendingUp, User, PenLine, LogOut } from "lucide-react"
import ComposeModal from "./ComposeModal"

const NAV = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/trending", label: "Trending", icon: TrendingUp },
  { href: "/profile", label: "Profile", icon: User },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [composeOpen, setComposeOpen] = useState(false)

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col border-r border-border bg-background px-4 py-5 lg:flex">
        {/* Logo */}
        <Link href="/feed" className="mb-8 flex items-center gap-2 px-2">
          <span className="h-3 w-3 rounded-full bg-primary" />
          <span className="text-lg font-semibold tracking-tight text-foreground">Signal</span>
        </Link>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Post CTA */}
        <button
          onClick={() => setComposeOpen(true)}
          className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98]"
        >
          <PenLine className="h-4 w-4" />
          Post
        </button>

        <div className="flex-1" />

        {/* Mini profile */}
        {session?.user && (
          <div className="group rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2.5">
              {session.user.image ? (
                <img src={session.user.image || "/placeholder.svg"} className="h-9 w-9 rounded-full" alt="" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{session.user.name}</p>
                <p className="text-[11px] text-muted-foreground">Verified human</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
            {/* Human score bar */}
            <div className="mt-2.5">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Human score
                </span>
                <span className="text-[11px] font-semibold text-verified">96%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-verified" style={{ width: "96%" }} />
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/feed" className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-primary" />
          <span className="text-lg font-semibold tracking-tight text-foreground">Signal</span>
        </Link>
        <div className="flex items-center gap-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
              </Link>
            )
          })}
          <button
            onClick={() => setComposeOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            aria-label="Post"
          >
            <PenLine className="h-4 w-4" />
          </button>
        </div>
      </header>

      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} onPosted={() => router.refresh()} />
    </>
  )
}
