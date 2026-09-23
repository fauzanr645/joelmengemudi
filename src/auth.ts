import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import prisma from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const normalizedEmail = (credentials.email as string).toLowerCase().trim()

        // Brute-force protection: Maksimal 8 percobaan login per email per menit
        const rateLimit = checkRateLimit(`login-attempt:${normalizedEmail}`, 8, 60_000)
        if (!rateLimit.allowed) {
          throw new Error("Terlalu banyak percobaan login gagal. Harap tunggu 1 menit.")
        }

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: { branch: true },
        })

        if (!user || !user.isActive) {
          return null
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          branchId: user.branchId,
          branchName: user.branch?.name || null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.branchId = (user as any).branchId
        token.branchName = (user as any).branchName
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role
        ;(session.user as any).branchId = token.branchId
        ;(session.user as any).branchName = token.branchName
      }
      return session
    },
  },
})
