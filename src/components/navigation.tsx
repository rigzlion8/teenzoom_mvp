"use client"

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Users, 
  MessageSquare, 
  Video, 
  Trophy, 
  Shield, 
  Menu, 
  Plus,
  User,
  Settings,
  LogOut
} from 'lucide-react'

export default function Navigation() {
  const { data: session } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const handleSignOut = () => {
    signOut()
    closeMobileMenu()
  }

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">T</span>
            </div>
            <span className="font-bold text-xl">TeenZoom</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
              <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
                Dashboard
              </Link>
              <Link href="/room/general" className="text-sm font-medium transition-colors hover:text-primary">
                Chat
              </Link>
              <Link href="/friends" className="text-sm font-medium transition-colors hover:text-primary">
                Friends
              </Link>
              <Link href="/messages" className="text-sm font-medium transition-colors hover:text-primary">
                Messages
              </Link>
              <Link href="/rooms" className="text-sm font-medium transition-colors hover:text-primary">
                Rooms
              </Link>
              <Link href="/videos" className="text-sm font-medium transition-colors hover:text-primary">
                Videos
              </Link>
              <Link href="/leaderboards" className="text-sm font-medium transition-colors hover:text-primary">
                Leaderboards
              </Link>
              {session?.user?.role === 'admin' || session?.user?.role === 'moderator' ? (
                <Link href="/moderation" className="text-sm font-medium transition-colors hover:text-primary">
                  Moderation
                </Link>
              ) : null}
            </div>

          {/* User Menu / Mobile Menu Button */}
          {session?.user ? (
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/rooms/create">
                <Button size="sm" className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Create Room</span>
                </Button>
              </Link>
              
              <div className="relative group">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{session.user.displayName || session.user.username}</span>
                </Button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-1">
                    <Link href="/dashboard" className="block px-4 py-2 text-sm text-foreground hover:bg-accent">
                      Dashboard
                    </Link>
                    <Link href="/settings" className="block px-4 py-2 text-sm text-foreground hover:bg-accent">
                      <Settings className="h-4 w-4 inline mr-2" />
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent"
                    >
                      <LogOut className="h-4 w-4 inline mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="md:hidden">
              <Button variant="ghost" onClick={toggleMobileMenu}>
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          {session?.user && (
            <Button variant="ghost" className="md:hidden" onClick={toggleMobileMenu}>
              <Menu className="h-6 w-6" />
            </Button>
          )}
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="py-4 space-y-2">
              {session?.user ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className="block px-4 py-2 text-foreground hover:bg-accent rounded-md"
                    onClick={closeMobileMenu}
                  >
                    <Home className="h-4 w-4 inline mr-2" />
                    Dashboard
                  </Link>
                  
                  <Link 
                    href="/friends" 
                    className="block px-4 py-2 text-foreground hover:bg-accent rounded-md"
                    onClick={closeMobileMenu}
                  >
                    <Users className="h-4 w-4 inline mr-2" />
                    Friends
                  </Link>
                  <Link
                    href="/messages"
                    className="block px-4 py-2 text-foreground hover:bg-accent rounded-md"
                    onClick={closeMobileMenu}
                  >
                    <MessageSquare className="h-4 w-4 inline mr-2" />
                    Messages
                  </Link>
                  
                  <Link 
                    href="/rooms" 
                    className="block px-4 py-2 text-foreground hover:bg-accent rounded-md"
                    onClick={closeMobileMenu}
                  >
                    <MessageSquare className="h-4 w-4 inline mr-2" />
                    Rooms
                  </Link>
                  
                  <Link 
                    href="/videos" 
                    className="block px-4 py-2 text-foreground hover:bg-accent rounded-md"
                    onClick={closeMobileMenu}
                  >
                    <Video className="h-4 w-4 inline mr-2" />
                    Videos
                  </Link>
                  
                  <Link 
                    href="/leaderboards" 
                    className="block px-4 py-2 text-foreground hover:bg-accent rounded-md"
                    onClick={closeMobileMenu}
                  >
                    <Trophy className="h-4 w-4 inline mr-2" />
                    Leaderboards
                  </Link>
                  
                  {(session.user.role === 'admin' || session.user.role === 'moderator') && (
                    <Link 
                      href="/moderation" 
                      className="block px-4 py-2 text-foreground hover:bg-accent rounded-md"
                      onClick={closeMobileMenu}
                    >
                      <Shield className="h-4 w-4 inline mr-2" />
                      Moderation
                    </Link>
                  )}
                  
                  <Link 
                    href="/rooms/create" 
                    className="block px-4 py-2 text-foreground hover:bg-accent rounded-md"
                    onClick={closeMobileMenu}
                  >
                    <Plus className="h-4 w-4 inline mr-2" />
                    Create Room
                  </Link>
                  
                  <Link 
                    href="/settings" 
                    className="block px-4 py-2 text-foreground hover:bg-accent rounded-md"
                    onClick={closeMobileMenu}
                  >
                    <Settings className="h-4 w-4 inline mr-2" />
                    Settings
                  </Link>
                  
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-foreground hover:bg-accent rounded-md"
                  >
                    <LogOut className="h-4 w-4 inline mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="px-4 space-y-2">
                  <Link href="/auth/signin" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full">Sign In</Button>
                  </Link>
                  <Link href="/auth/signup" onClick={closeMobileMenu}>
                    <Button className="w-full">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
