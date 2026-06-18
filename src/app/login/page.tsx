"use client"
import { signIn } from "next-auth/react"
import { ShieldCheck } from "lucide-react"

function GithubIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

const HIGHLIGHTS = [
  "Human Authenticity Score on every post",
  "A transparent reason for everything you see",
  "An algorithm you tune yourself",
]

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-7 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-lg font-semibold tracking-tight text-foreground">Signal</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            Social media built on trust, not attention
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A feed where authenticity and transparent algorithms replace engagement bait.
          </p>

          <ul className="my-7 space-y-2.5">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-start gap-2.5 text-sm text-foreground">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <ShieldCheck className="h-3 w-3 text-verified" />
                </span>
                {h}
              </li>
            ))}
          </ul>

          <button
            onClick={() => signIn("github", { callbackUrl: "/feed" })}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <GithubIcon />
            Continue with GitHub
          </button>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            By continuing you agree to Signal&apos;s terms of service.
          </p>
        </div>
      </div>
    </div>
  )
}
