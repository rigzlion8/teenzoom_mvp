import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username: string
      email?: string
      displayName: string
      role: string
      coins: number
      vipLifetime: boolean
      xp: number
      level: number
    }
  }
  
  interface User {
    id: string
    username: string
    email?: string
    displayName: string
    role: string
    coins: number
    vipLifetime: boolean
    xp: number
    level: number
  }
}

// Extend JWT types
declare module "next-auth/jwt" {
  interface JWT {
    role: string
    coins: number
    vipLifetime: boolean
    xp: number
    level: number
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          // Try to find user by username first, then by email
          let user = await prisma.user.findUnique({
            where: { username: credentials.username }
          })

          // If not found by username, try email
          if (!user) {
            user = await prisma.user.findUnique({
              where: { email: credentials.username }
            })
          }

          if (!user) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            username: user.username,
            email: user.email || undefined,
            displayName: user.displayName,
            role: user.role,
            coins: Number(user.coins),
            vipLifetime: user.vipLifetime,
            xp: Number(user.xp),
            level: Number(user.level)
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.coins = user.coins
        token.vipLifetime = user.vipLifetime
        token.xp = user.xp
        token.level = user.level
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role
        session.user.coins = token.coins
        session.user.vipLifetime = token.vipLifetime
        session.user.xp = token.xp
        session.user.level = token.level
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin"
  }
}
