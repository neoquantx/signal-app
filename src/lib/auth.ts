import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        token.sub = String((profile as { id?: number }).id)
        token.username = (profile as { login?: string }).login
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
