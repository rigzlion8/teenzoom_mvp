"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Home, 
  MessageCircle, 
  Users, 
  Video, 
  Coins, 
  LogOut,
  Menu,
  X
} from "lucide-react"
import { useState } from "react"

export function Navigation() {
  const { data: session } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  if (!session?.user) {
    return (
      <nav className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                TeenZoom
              </h1>
              <Badge variant="secondary" className="bg-purple-600 text-white">
                v2.0
              </Badge>
            </Link>
            
            <div className="hidden md:flex items-center gap-4">
              <Link href="/auth/signin">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Sign Up
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white"
              onClick={toggleMobileMenu}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-white/20">
              <div className="flex flex-col gap-2 pt-4">
                <Link href="/auth/signin">
                  <Button variant="outline" className="w-full border-white text-white hover:bg-white hover:text-gray-900">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white/10 backdrop-blur-sm border-b border-white/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              TeenZoom
            </h1>
            <Badge variant="secondary" className="bg-purple-600 text-white">
              v2.0
            </Badge>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 text-white hover:text-purple-300 transition-colors">
              <Home className="w-4 h-4" />
              Dashboard
            </Link>
            <Link href="/rooms" className="flex items-center gap-2 text-white hover:text-purple-300 transition-colors">
              <MessageCircle className="w-4 h-4" />
              Rooms
            </Link>
            <Link href="/friends" className="flex items-center gap-2 text-white hover:text-purple-300 transition-colors">
              <Users className="w-4 h-4" />
              Friends
            </Link>
            <Link href="/videos" className="flex items-center gap-2 text-white hover:text-purple-300 transition-colors">
              <Video className="w-4 h-4" />
              Videos
            </Link>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 text-white">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="font-semibold">{session.user.coins || 0}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/20">
            <div className="flex flex-col gap-2 pt-4">
              <Link href="/dashboard" className="flex items-center gap-2 text-white py-2 px-3 rounded hover:bg-white/10">
                <Home className="w-4 h-4" />
                Dashboard
              </Link>
              <Link href="/rooms" className="flex items-center gap-2 text-white py-2 px-3 rounded hover:bg-white/10">
                <MessageCircle className="w-4 h-4" />
                Rooms
              </Link>
              <Link href="/friends" className="flex items-center gap-2 text-white py-2 px-3 rounded hover:bg-white/10">
                <Users className="w-4 h-4" />
                Friends
              </Link>
              <Link href="/videos" className="flex items-center gap-2 text-white py-2 px-3 rounded hover:bg-white/10">
                <Video className="w-4 h-4" />
                Videos
              </Link>
              <div className="border-t border-white/20 my-2"></div>
              <div className="flex items-center gap-2 text-white py-2 px-3">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="font-semibold">{session.user.coins || 0} coins</span>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-white/10"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
