"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Video, Users, X, Mic, MicOff, VideoOff, RefreshCw } from 'lucide-react'
import { useLivestreamContext } from '@/contexts/livestream-context'
import { LivestreamVideoPlayer } from '@/components/ui/livestream-video-player'

interface PersonalLivestreamStreamerProps {
  onClose: () => void
}

export function PersonalLivestreamStreamer({ onClose }: PersonalLivestreamStreamerProps) {
  const {
    isStreaming,
    title,
    description,
    privacy,
    viewerCount,
    localTracks,
    connectionStatus,
    stopStream,
    toggleVideo,
    toggleAudio
  } = useLivestreamContext()

  const handleStopStream = async () => {
    try {
      await stopStream()
      onClose()
    } catch (error) {
      console.error('Failed to stop stream:', error)
    }
  }

  if (!isStreaming) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <Card className="w-full h-full max-w-7xl max-h-[95vh] bg-white/10 backdrop-blur-sm border-white/20 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-4 px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
              <Video className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-white text-sm sm:text-lg truncate">{title}</CardTitle>
              <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
                <Badge variant="default" className="bg-green-500 text-white text-xs">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></div>
                  YOU&apos;RE LIVE
                </Badge>
                {connectionStatus === 'connecting' && (
                  <Badge variant="outline" className="text-yellow-400 border-yellow-400 text-xs">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-1"></div>
                    CONNECTING...
                  </Badge>
                )}
                {connectionStatus === 'failed' && (
                  <Badge variant="destructive" className="text-xs">
                    <div className="w-2 h-2 bg-red-400 rounded-full mr-1"></div>
                    CONNECTION FAILED
                  </Badge>
                )}
                <span className="text-xs sm:text-sm text-gray-300">
                  {privacy === 'friends-only' ? 'Friends Only' : 'Public'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 text-white text-sm">
              <Users className="h-4 w-4" />
              <span>{viewerCount} watching</span>
            </div>
            
            {/* Camera and Mic Controls - Moved to top */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                onClick={toggleVideo}
                variant="outline"
                size="sm"
                className={`text-white border-white/30 hover:bg-white/10 text-xs sm:text-sm px-2 sm:px-3 ${
                  localTracks.video?.enabled ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}
              >
                {localTracks.video?.enabled ? (
                  <>
                    <Video className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Camera</span>
                  </>
                ) : (
                  <>
                    <VideoOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Camera</span>
                  </>
                )}
              </Button>

              <Button
                onClick={toggleAudio}
                variant="outline"
                size="sm"
                className={`text-white border-white/30 hover:bg-white/10 text-xs sm:text-sm px-2 sm:px-3 ${
                  localTracks.audio?.enabled ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}
              >
                {localTracks.audio?.enabled ? (
                  <>
                    <Mic className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Mic</span>
                  </>
                ) : (
                  <>
                    <MicOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Mic</span>
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex gap-1 sm:gap-2">
              {connectionStatus === 'failed' && (
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                  className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-white text-xs sm:text-sm px-2 sm:px-3"
                >
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Retry</span>
                </Button>
              )}
              <Button
                onClick={handleStopStream}
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm px-2 sm:px-3"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">End</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col px-3 sm:px-6 pb-3 sm:pb-6">
          {/* Main Video Area */}
          <div className="flex-1 relative bg-black rounded-lg overflow-hidden mb-3 sm:mb-4">
            {localTracks.video ? (
              <LivestreamVideoPlayer
                videoTrack={localTracks.video}
                audioTrack={localTracks.audio}
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <Video className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">Camera not available</p>
                </div>
              </div>
            )}
          </div>

          {/* Stream Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 text-white text-xs sm:text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{viewerCount} watching</span>
              </div>
              <div className="hidden sm:block">•</div>
              <span>Streaming to: {privacy === 'friends-only' ? 'Friends Only' : 'Public'}</span>
            </div>

            <div className="text-white text-xs sm:text-sm text-right">
              <p className="sm:hidden">Viewers: {viewerCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
