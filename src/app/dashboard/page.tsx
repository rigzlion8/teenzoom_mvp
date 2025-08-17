"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  MessageCircle, 
  Coins, 
  Star, 
  LogOut, 
  Settings,
  Plus,
  Video,
  Trophy
} from "lucide-react"
import { signOut } from "next-auth/react"

interface UserStats {
  coins: number
  xp: number
  level: number
  vipLifetime: boolean
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated" && session?.user) {
      setUserStats({
        coins: session.user.coins || 0,
        xp: session.user.xp || 0,
        level: session.user.level || 1,
        vipLifetime: session.user.vipLifetime || false
      })
      setIsLoading(false)
    }
  }, [session, status, router])

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  const handleJoinRoom = (roomId: string) => {
    router.push(`/room/${roomId}`)
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <h1 className="text-xl sm:text-2xl font-bold text-white">TeenZoom Dashboard</h1>
              <Badge variant="secondary" className="bg-purple-600 text-white text-xs sm:text-sm">
                v2.0
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2 text-white">
                <Coins className="w-5 h-5 text-yellow-400" />
                <span className="font-semibold">{userStats?.coins}</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-white">
                <Trophy className="w-5 h-5 text-blue-400" />
                <span className="font-semibold">Level {userStats?.level}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 w-8 h-8 sm:w-10 sm:h-10"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
          
          {/* Mobile Stats */}
          <div className="sm:hidden flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/20">
            <div className="flex items-center gap-2 text-white">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="font-semibold text-sm">{userStats?.coins}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Trophy className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-sm">Level {userStats?.level}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Welcome back, {session.user.displayName || session.user.username}!
          </h2>
          <p className="text-gray-300 text-sm sm:text-base">
            Ready to connect with friends and explore new rooms?
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader className="pb-2 p-3 sm:p-6">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                <CardTitle className="text-sm sm:text-lg">Coins</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <p className="text-2xl sm:text-3xl font-bold text-yellow-400">{userStats?.coins}</p>
              <p className="text-xs sm:text-sm text-gray-300">Available balance</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader className="pb-2 p-3 sm:p-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                <CardTitle className="text-sm sm:text-lg">Level</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <p className="text-2xl sm:text-3xl font-bold text-blue-400">{userStats?.level}</p>
              <p className="text-xs sm:text-sm text-gray-300">Current level</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader className="pb-2 p-3 sm:p-6">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                <CardTitle className="text-sm sm:text-lg">XP</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <p className="text-2xl sm:text-3xl font-bold text-purple-400">{userStats?.xp}</p>
              <p className="text-xs sm:text-sm text-gray-300">Experience points</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader className="pb-2 p-3 sm:p-6">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" />
                <CardTitle className="text-sm sm:text-lg">VIP Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <p className="text-lg sm:text-3xl font-bold text-pink-400">
                {userStats?.vipLifetime ? "Lifetime" : "Standard"}
              </p>
              <p className="text-xs sm:text-sm text-gray-300">Membership</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Quick Actions</h3>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button 
              onClick={() => handleJoinRoom("general")}
              className="bg-purple-600 hover:bg-purple-700 text-sm sm:text-base py-2 sm:py-3"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Join General Chat
            </Button>
            <Button 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-gray-900 text-sm sm:text-base py-2 sm:py-3"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Room
            </Button>
            <Button 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-gray-900 text-sm sm:text-base py-2 sm:py-3"
            >
              <Video className="w-4 h-4 mr-2" />
              Upload Video
            </Button>
            <Button 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-gray-900 text-sm sm:text-base py-2 sm:py-3"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Recent Activity</h3>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-4 sm:p-6">
              <p className="text-gray-300 text-center py-6 sm:py-8 text-sm sm:text-base">
                No recent activity yet. Start chatting to see your activity here!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
