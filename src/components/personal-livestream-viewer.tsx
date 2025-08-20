"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Video, Users, X, Volume2, VolumeX } from 'lucide-react'
import { useLivestreamContext } from '@/contexts/livestream-context'
import { LivestreamVideoPlayer } from '@/components/ui/livestream-video-player'

interface PersonalLivestreamViewerProps {
  onClose: () => void
}

export function PersonalLivestreamViewer({ onClose }: PersonalLivestreamViewerProps) {
  const {
    isViewing,
    streamerName,
    title,
    description,
    privacy,
    viewerCount,
    remoteUsers,
    leaveStream
  } = useLivestreamContext()

  const handleLeaveStream = async () => {
    try {
      await leaveStream()
      onClose()
    } catch (error) {
      console.error('Failed to leave stream:', error)
    }
  }

  if (!isViewing) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[90vh] bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
              {streamerName?.charAt(0) || 'S'}
            </div>
            <div>
              <CardTitle className="text-white text-lg">{title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="destructive" className="bg-red-500 text-white text-xs">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></div>
                  LIVE
                </Badge>
                <span className="text-sm text-gray-300">
                  by {streamerName}
                </span>
                {privacy === 'friends-only' && (
                  <Badge variant="outline" className="text-xs border-white/30 text-white">
                    <Users className="h-3 w-3 mr-1" />
                    Friends Only
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-white text-sm">
              <Users className="h-4 w-4" />
              <span>{viewerCount} watching</span>
            </div>
            <Button
              onClick={handleLeaveStream}
              variant="outline"
              size="sm"
              className="text-white border-white/30 hover:bg-white/10"
            >
              <X className="h-4 w-4 mr-2" />
              Leave Stream
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="h-full flex flex-col">
          {/* Main Video Area */}
          <div className="flex-1 relative bg-black rounded-lg overflow-hidden mb-4">
            {remoteUsers.length > 0 && remoteUsers[0].videoTrack ? (
              <LivestreamVideoPlayer
                videoTrack={remoteUsers[0].videoTrack}
                audioTrack={remoteUsers[0].audioTrack}
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Waiting for stream to start...</p>
                </div>
              </div>
            )}
          </div>

          {/* Stream Info */}
          {description && (
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <h4 className="text-white font-medium mb-2">About this stream</h4>
              <p className="text-gray-300 text-sm">{description}</p>
            </div>
          )}

          {/* Stream Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white text-sm">
              <span>Stream controls will appear here</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-white border-white/30 hover:bg-white/10"
              >
                <Volume2 className="h-4 w-4 mr-2" />
                Mute
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
