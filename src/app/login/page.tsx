"use client"
import { signIn } from "next-auth/react"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 px-4 py-12 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 sm:p-12 w-full max-w-lg text-center">
        
        {/* Animated Pulse Logo */}
        <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-blue-100/70 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-blue-50 animate-pulse" />
          <div className="relative w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20A16 16 0 0 1 20 4" />
              <path d="M4 15A11 11 0 0 1 15 4" />
              <path d="M4 10A6 6 0 0 1 10 4" />
              <circle cx="4" cy="4" r="1.5" fill="currentColor" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] mb-2">Signal</h1>
        <p className="text-slate-500 text-sm mb-8">Social media built on trust, not attention</p>
        
        {/* 3 Trust Feature Pills */}
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center items-center mb-8">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-100 bg-white text-[11px] font-medium text-[#475569] shadow-sm shadow-slate-100/50">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Human verified</span>
          </div>
          
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-100 bg-white text-[11px] font-medium text-[#475569] shadow-sm shadow-slate-100/50">
            <svg className="w-3.5 h-3.5 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            <span>Transparent algorithm</span>
          </div>

          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-100 bg-white text-[11px] font-medium text-[#475569] shadow-sm shadow-slate-100/50">
            <svg className="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <span>No ads ever</span>
          </div>
        </div>

        {/* GitHub Button */}
        <button
          onClick={() => signIn("github", { callbackUrl: "/feed" })}
          className="w-full bg-[#0F172A] text-white rounded-xl py-3.5 px-4 text-sm font-medium hover:bg-[#1E293B] hover:scale-[1.015] active:scale-[0.985] transition-all duration-200 shadow-lg shadow-slate-900/10 flex items-center justify-center gap-3 cursor-pointer"
        >
          <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Continue with GitHub
        </button>
        
        <p className="text-xs text-slate-400 mt-6">
          By continuing, you agree to Signal's terms of service
        </p>
      </div>
    </div>
  )
}
