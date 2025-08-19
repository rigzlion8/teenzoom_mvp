"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Coins, 
  Star, 
  Trophy,
  User,
  ArrowLeft,
  Bell,
  Shield,
  Palette
} from "lucide-react"
import Link from "next/link"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

interface UserStats {
  coins: number
  xp: number
  level: number
  vipLifetime: boolean
}

export default function ProfilePage() {
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

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const initial = (session.user.displayName || session.user.username || "?").slice(0, 1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                  {initial}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {session.user.displayName || session.user.username}
                  </h1>
                  <p className="text-sm text-gray-300">@{session.user.username}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Trophy className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-sm">Level {userStats?.level}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Profile Header */}
        <div className="mb-8 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-3xl mx-auto mb-4">
            {initial}
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {session.user.displayName || session.user.username}
          </h2>
          <p className="text-gray-300 text-lg">Your TeenZoom Profile</p>
          <div className="mt-4">
            <Badge variant="outline" className="text-white border-white/30">
              <User className="w-4 h-4 mr-2" />
              TeenZoom Member
            </Badge>
          </div>
        </div>

        {/* Stats Grid - Migrated from Dashboard */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Your Stats</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
        </div>

        {/* Settings Section - Replacing Profile Actions */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Settings</h3>
          <div className="grid gap-6 max-w-4xl mx-auto">
            {/* Profile Settings */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={session.user.username}
                    disabled
                    className="bg-white/20 border-white/30 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={session.user.displayName || 'Not set'}
                    disabled
                    className="bg-white/20 border-white/30 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={session.user.email || 'Not set'}
                    disabled
                    className="bg-white/20 border-white/30 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-300">Receive email updates</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-300">Receive push notifications</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Privacy & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Profile Visibility</Label>
                    <p className="text-sm text-gray-300">Make profile public</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Online Status</Label>
                    <p className="text-sm text-gray-300">Show when online</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Theme Settings */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-gray-300">Use dark theme</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Navigation Button */}
          <div className="flex justify-center mt-8">
            <Button 
              onClick={() => router.push("/dashboard")}
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-gray-900 px-6 py-3"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Additional Profile Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-lg">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Username:</span>
                <span className="font-medium">@{session.user.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Display Name:</span>
                <span className="font-medium">{session.user.displayName || "Not set"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Role:</span>
                <span className="font-medium capitalize">{session.user.role}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-lg">Achievements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Level Progress:</span>
                <span className="font-medium">Level {userStats?.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Total XP:</span>
                <span className="font-medium">{userStats?.xp} points</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">VIP Status:</span>
                <span className="font-medium">{userStats?.vipLifetime ? "Lifetime VIP" : "Standard Member"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
