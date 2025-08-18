import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/providers/auth-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Navigation from '@/components/navigation'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TeenZoom v2.0 - Next Generation Teen Social Platform",
  description: "A modern, secure, and feature-rich social platform built for teens with Next.js 15, React, MongoDB, and Redis.",
  keywords: ["teen", "social", "chat", "platform", "nextjs", "react", "mongodb"],
  authors: [{ name: "TeenZoom Team" }],
  viewport: "width=device-width, initial-scale=1",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Navigation />
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
