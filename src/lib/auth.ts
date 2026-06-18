import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { putItem, getItem } from "./dynamo"

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
        const userId = String((profile as { id?: number }).id)
        token.sub = userId
        token.username = (profile as { login?: string }).login
        try {
          const existing = await getItem(`USER#${userId}`, "PROFILE")
          if (!existing) {
            await putItem({
              PK: `USER#${userId}`,
              SK: "PROFILE",
              id: userId,
              name: token.name ?? "Anonymous",
              email: token.email ?? "",
              image: token.picture ?? "",
              username: token.username ?? "",
              humanScore: 100,
              topicIds: [],
              createdAt: new Date().toISOString(),
            })
          }
        } catch (err) {
          console.error("DB error saving user:", err)
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
