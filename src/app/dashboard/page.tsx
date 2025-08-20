"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  MessageCircle, 
  Coins, 
  LogOut, 
  Settings,
  Plus,
  Video,
  Trophy,
  ArrowRight,
  Users,
  Globe,
  Lock,
  User
} from "lucide-react"
import { signOut } from "next-auth/react"
import { DashboardNotifications } from '@/components/dashboard-notifications'
import { CardDescription } from "@/components/ui/card"
import { GoLiveDialog } from '@/components/go-live-dialog'
import { LiveStreamsDisplay } from '@/components/live-streams-display'
import { PersonalLivestreamViewer } from '@/components/personal-livestream-viewer'
import { PersonalLivestreamStreamer } from '@/components/personal-livestream-streamer'
import { useLivestreamContext } from '@/contexts/livestream-context'
import Link from "next/link"

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
  const [currentStream, setCurrentStream] = useState<{
    title: string
    privacy: string
    viewerCount: number
  } | null>(null)

  // Use the livestream context to get real-time state
  const {
    isStreaming,
    isViewing,
    title: streamTitle,
    privacy: streamPrivacy,
    viewerCount: streamViewerCount,
    connectionStatus
  } = useLivestreamContext()

  // Debug hook values (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Dashboard state:', { isStreaming, isViewing, streamTitle, streamPrivacy, streamViewerCount, connectionStatus })
  }

  const checkCurrentStream = useCallback(async () => {
    try {
      const response = await fetch('/api/livestream/personal')
      if (response.ok) {
        const data = await response.json()
        // Check if user has an active stream
        const activeStream = data.livestreams?.find((stream: { streamer: { id: string }; isLive: boolean; title: string; privacy: string; viewerCount?: number }) => 
          stream.streamer.id === session?.user?.id && stream.isLive
        )
        
        if (activeStream) {
          setCurrentStream({
            title: activeStream.title,
            privacy: activeStream.privacy,
            viewerCount: activeStream.viewerCount || 0
          })
        } else {
          setCurrentStream(null)
        }
      }
    } catch (error) {
      console.error('Failed to check current stream:', error)
    }
  }, [session?.user?.id])

  // Update current stream info when hook state changes
  useEffect(() => {
    if (isStreaming && streamTitle) {
      setCurrentStream({
        title: streamTitle,
        privacy: streamPrivacy || 'public',
        viewerCount: streamViewerCount
      })
    } else if (!isStreaming) {
      setCurrentStream(null)
    }
  }, [isStreaming, streamTitle, streamPrivacy, streamViewerCount])

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
      checkCurrentStream()
    }
  }, [session, status, router, checkCurrentStream])

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
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

  const userInitial = (session.user.displayName || session.user.username || "?").slice(0, 1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                {userInitial}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {session.user.displayName || session.user.username}
                </h1>
                <p className="text-sm text-gray-300">@{session.user.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-white">
                <Trophy className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-sm">Level {userStats?.level}</span>
              </div>
              <Button
                onClick={() => router.push("/profile")}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
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

        {/* Current Stream Info */}
        {isStreaming && currentStream && (
          <div className="mb-6 sm:mb-8">
            <Card className="bg-green-900/20 backdrop-blur-sm border-green-500/30">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      <Video className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        You&apos;re Live: {currentStream.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-green-300">
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          LIVE
                        </span>
                        {connectionStatus === 'connecting' && (
                          <span className="flex items-center gap-1 text-yellow-400">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                            CONNECTING...
                          </span>
                        )}
                        {connectionStatus === 'failed' && (
                          <span className="flex items-center gap-1 text-red-400">
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                            CONNECTION FAILED
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {currentStream.viewerCount} watching
                        </span>
                        <span className="flex items-center gap-1">
                          {currentStream.privacy === 'public' ? (
                            <>
                              <Globe className="h-4 w-4" />
                              Public
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4" />
                              Friends Only
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => {
                      // This will be handled by the PersonalLivestreamViewer
                      // For now, just show a message
                      alert("Use the Stop Stream button in the stream viewer to end your stream")
                    }}
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Stop Stream
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions Cards */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <Link href="/room/general" className="block">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-200 cursor-pointer group h-full">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400 mb-3" />
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:w-5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">Real-time Chat</CardTitle>
                  <CardDescription className="text-gray-300 text-sm">
                    Join the general chat room
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/videos" className="block">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-200 cursor-pointer group h-full">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <Video className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400 mb-3" />
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:w-5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">Video Sharing</CardTitle>
                  <CardDescription className="text-gray-300 text-sm">
                    Upload and watch videos
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/rooms" className="block">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-200 cursor-pointer group h-full">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <Users className="w-8 h-8 sm:w-10 sm:h-10 text-green-400 mb-3" />
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:w-5 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">Community</CardTitle>
                  <CardDescription className="text-gray-300 text-sm">
                    Discover and join rooms
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        {/* Quick Actions Buttons */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">More Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <GoLiveDialog connectionStatus={connectionStatus}>
              <Button 
                className={`text-sm sm:text-base py-2 sm:py-3 w-full ${
                  isStreaming 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : connectionStatus === 'connecting'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : connectionStatus === 'failed'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
                disabled={isStreaming || connectionStatus === 'connecting'}
              >
                <Video className="w-4 h-4 mr-2" />
                {isStreaming 
                  ? 'Already Live' 
                  : connectionStatus === 'connecting'
                  ? 'Connecting...'
                  : connectionStatus === 'failed'
                    ? 'Connection Failed'
                    : 'Go Live'
                }
              </Button>
            </GoLiveDialog>
            <Button 
              onClick={() => router.push("/rooms")}
              className="bg-purple-600 hover:bg-purple-700 text-sm sm:text-base py-2 sm:py-3 w-full"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Browse Rooms
            </Button>
            <Button 
              onClick={() => router.push("/rooms/create")}
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-gray-900 text-sm sm:text-base py-2 sm:py-3 w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Room
            </Button>
            <Button 
              onClick={() => router.push("/videos")}
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-gray-900 text-sm sm:text-base py-2 sm:py-3 w-full"
            >
              <Video className="w-4 h-4 mr-2" />
              Upload Video
            </Button>
            <Button 
              onClick={() => router.push("/profile")}
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-gray-900 text-sm sm:text-base py-2 sm:py-3 w-full"
            >
              <User className="w-4 h-4 mr-2" />
              View Profile
            </Button>
          </div>
        </div>

        {/* Live Streams Section */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Live Streams</h3>
          <div className="grid gap-6">
            {/* Friends' Live Streams */}
            <LiveStreamsDisplay
              type="friends-only"
              title="Friends Live"
              description="Watch streams from your friends"
            />
            
            {/* Public Live Streams */}
            <LiveStreamsDisplay
              type="public"
              title="Discover Live"
              description="Find and join public streams from the community"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <DashboardNotifications />
        </div>

        {/* Personal Livestream Components */}
        {(() => {
          console.log('🔍 About to render livestream components:', { isStreaming, isViewing })
          return isStreaming ? (
            <PersonalLivestreamStreamer onClose={() => {}} />
          ) : isViewing ? (
            <PersonalLivestreamViewer onClose={() => {}} />
          ) : null
        })()}
      </div>
    </div>
  )
}
