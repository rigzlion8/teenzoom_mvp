"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Video, Globe, Lock, Eye } from 'lucide-react'
import { usePersonalLivestream } from '@/hooks/use-personal-livestream'
import { useToast } from '@/hooks/use-toast'

interface LiveStream {
  id: string
  title: string
  description?: string
  privacy: 'public' | 'friends-only'
  startedAt: string
  streamer: {
    id: string
    username: string
    displayName: string
  }
}

interface LiveStreamsDisplayProps {
  type: 'discover' | 'friends'
  title: string
  description: string
}

export function LiveStreamsDisplay({ type, title, description }: LiveStreamsDisplayProps) {
  const { toast } = useToast()
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const {
    joinStream,
    leaveStream,
    isViewing,
    streamerId: currentStreamerId,
    connectionStatus
  } = usePersonalLivestream()

  const loadLiveStreams = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/livestream/personal?type=${type}`)
      
      if (response.ok) {
        const data = await response.json()
        setLiveStreams(data.livestreams)
      } else {
        throw new Error('Failed to load live streams')
      }
    } catch (error) {
      console.error('Error loading live streams:', error)
      toast({
        title: "Error",
        description: "Failed to load live streams",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [type, toast])

  const refreshStreams = useCallback(async () => {
    setRefreshing(true)
    await loadLiveStreams()
    setRefreshing(false)
  }, [loadLiveStreams])

  useEffect(() => {
    loadLiveStreams()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadLiveStreams, 30000)
    return () => clearInterval(interval)
  }, [loadLiveStreams])

  const handleJoinStream = async (stream: LiveStream) => {
    try {
      await joinStream(stream.streamer.id)
      toast({
        title: "Success",
        description: `Joined ${stream.streamer.displayName}'s stream!`,
      })
    } catch (error) {
      console.error('Failed to join stream:', error)
      toast({
        title: "Error",
        description: "Failed to join stream. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleLeaveStream = async () => {
    try {
      await leaveStream()
      toast({
        title: "Success",
        description: "Left the stream",
      })
    } catch (error) {
      console.error('Failed to leave stream:', error)
      toast({
        title: "Error",
        description: "Failed to leave stream. Please try again.",
        variant: "destructive"
      })
    }
  }

  const formatStreamDuration = (startedAt: string) => {
    const start = new Date(startedAt)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just started'
    if (diffInMinutes < 60) return `${diffInMinutes}m live`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h live`
    return `${Math.floor(diffInMinutes / 1440)}d live`
  }

  if (isLoading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading live streams...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Video className="h-5 w-5 text-red-500" />
              {title}
            </CardTitle>
            <p className="text-gray-300 text-sm mt-1">{description}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStreams}
            disabled={refreshing}
            className="text-white border-white/30 hover:bg-white/10"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {liveStreams.length === 0 ? (
          <div className="text-center py-8 text-gray-300">
            <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No live streams at the moment</p>
            <p className="text-sm text-gray-400 mt-1">
              {type === 'discover' 
                ? 'Check back later for public streams'
                : 'Your friends are not currently live'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {liveStreams.map((stream) => (
              <div
                key={stream.id}
                className="flex items-center justify-between p-4 border border-white/20 rounded-lg bg-white/5"
              >
                <div className="flex items-center gap-4">
                  {/* Streamer Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {stream.streamer.displayName?.charAt(0) || stream.streamer.username.charAt(0)}
                  </div>

                  {/* Stream Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">{stream.title}</h3>
                      <Badge variant="destructive" className="bg-red-500 text-white text-xs">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></div>
                        LIVE
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-1">
                      by {stream.streamer.displayName || stream.streamer.username}
                    </p>
                    
                    {stream.description && (
                      <p className="text-xs text-gray-400 truncate">{stream.description}</p>
                    )}
                    
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Eye className="h-3 w-3" />
                        {formatStreamDuration(stream.startedAt)}
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        {stream.privacy === 'public' ? (
                          <>
                            <Globe className="h-3 w-3" />
                            Public
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3" />
                            Friends Only
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0">
                  {isViewing && currentStreamerId === stream.streamer.id ? (
                    <Button
                      onClick={handleLeaveStream}
                      variant="outline"
                      size="sm"
                      className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                    >
                      Leave Stream
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleJoinStream(stream)}
                      size="sm"
                      disabled={connectionStatus === 'connecting'}
                      className={`${
                        connectionStatus === 'connecting'
                          ? 'bg-yellow-600 hover:bg-yellow-700'
                          : connectionStatus === 'failed'
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-red-600 hover:bg-red-700'
                      } text-white`}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      {connectionStatus === 'connecting' ? 'Connecting...' : 'Join Stream'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
