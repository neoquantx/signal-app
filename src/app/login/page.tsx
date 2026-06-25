"use client"
import { signIn } from "next-auth/react"
import { useEffect } from "react"

export default function LoginPage() {
  useEffect(() => {
    const card = document.getElementById("login-card")
    if (card) {
      card.animate(
        [
          { opacity: 0, transform: "translateY(20px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: 800,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "forwards",
        }
      )
    }
  }, [])

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 overflow-hidden relative">
      <div className="relative z-10 w-full max-w-[440px] px-6 card-initial" id="login-card">
        <div className="glass-panel rounded-[32px] shadow-2xl p-12 text-center">
          <div className="relative mx-auto mb-6 flex items-center justify-center w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-accent-green/20 animate-ping"></div>
            <div className="relative z-10 w-16 h-16 rounded-full overflow-hidden bg-accent-green flex items-center justify-center text-accent-cream font-serif text-3xl border border-white/10">
              S
            </div>
          </div>
          <h1 className="text-5xl font-serif text-white mb-4">Signal</h1>
          <p className="text-white/80 text-lg mb-12 font-body leading-relaxed">
            Social media built on trust, not attention
          </p>
          <div className="space-y-4">
            <button
              onClick={() => signIn("google", { callbackUrl: "/connect" })}
              className="w-full bg-white/10 border border-white/20 text-white rounded-2xl py-4 px-6 text-base font-medium hover:bg-white/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-md group cursor-pointer"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                ></path>
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                ></path>
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                ></path>
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                ></path>
              </svg>
              Continue with Google
            </button>
            <button
              onClick={() => signIn("github", { callbackUrl: "/connect" })}
              className="w-full bg-black/40 border border-white/10 text-white rounded-2xl py-4 px-6 text-base font-medium hover:bg-black/60 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-md cursor-pointer"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"></path>
              </svg>
              Continue with GitHub
            </button>
          </div>
          <p className="text-sm text-white/60 mt-12 font-body">
            By continuing, you agree to Signal&apos;s{" "}
            <a
              className="text-white underline underline-offset-4 hover:text-accent-cream transition-colors"
              href="#"
            >
              terms of service
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
