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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[90vh] bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">{title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
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
                <span className="text-sm text-gray-300">
                  {privacy === 'friends-only' ? 'Friends Only' : 'Public'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-white text-sm">
              <Users className="h-4 w-4" />
              <span>{viewerCount} watching</span>
            </div>
                              <div className="flex gap-2">
                    {connectionStatus === 'failed' && (
                      <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                        size="sm"
                        className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-white"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry Connection
                      </Button>
                    )}
                    <Button
                      onClick={handleStopStream}
                      variant="destructive"
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <X className="h-4 w-4 mr-2" />
                      End Stream
                    </Button>
                  </div>
          </div>
        </CardHeader>
        
        <CardContent className="h-full flex flex-col">
          {/* Main Video Area */}
          <div className="flex-1 relative bg-black rounded-lg overflow-hidden mb-4">
            {localTracks.video ? (
              <LivestreamVideoPlayer
                videoTrack={localTracks.video}
                audioTrack={localTracks.audio}
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Camera not available</p>
                </div>
              </div>
            )}
          </div>

          {/* Stream Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={toggleVideo}
                variant="outline"
                size="sm"
                className={`text-white border-white/30 hover:bg-white/10 ${
                  localTracks.video?.enabled ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}
              >
                {localTracks.video?.enabled ? (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    Camera On
                  </>
                ) : (
                  <>
                    <VideoOff className="h-4 w-4 mr-2" />
                    Camera Off
                  </>
                )}
              </Button>

              <Button
                onClick={toggleAudio}
                variant="outline"
                size="sm"
                className={`text-white border-white/30 hover:bg-white/10 ${
                  localTracks.audio?.enabled ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}
              >
                {localTracks.audio?.enabled ? (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Mic On
                  </>
                ) : (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Mic Off
                  </>
                )}
              </Button>
            </div>

            <div className="text-white text-sm">
              <p>Streaming to: {privacy === 'friends-only' ? 'Friends Only' : 'Public'}</p>
              <p className="text-gray-300">Viewers: {viewerCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
