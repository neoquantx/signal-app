import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: { prompt: "select_account" },
      },
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, profile, account }) {
      if (profile) {
        if (account?.provider === "google") {
          token.sub = profile.sub as string
        } else if (account?.provider === "github") {
          token.sub = String((profile as { id?: number }).id)
          token.username = (profile as { login?: string }).login
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub
        ;(session.user as { username?: string }).username = token.username as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
