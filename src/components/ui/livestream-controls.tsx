"use client"

import { Button } from '@/components/ui/button'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Square, 
  Settings,
  Users
} from 'lucide-react'

interface LivestreamControlsProps {
  isStreaming: boolean
  isLive: boolean
  viewerCount: number
  onStartStream: () => void
  onStopStream: () => void
  onToggleVideo: () => void
  onToggleAudio: () => void
  onSettings?: () => void
  className?: string
}

export const LivestreamControls = ({
  isStreaming,
  isLive,
  viewerCount,
  onStartStream,
  onStopStream,
  onToggleVideo,
  onToggleAudio,
  onSettings,
  className = ''
}: LivestreamControlsProps) => {
  return (
    <div className={`flex items-center gap-2 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 ${className}`}>
      {/* Stream Control */}
      {!isStreaming ? (
        <Button
          onClick={onStartStream}
          className="bg-green-600 hover:bg-green-700 text-white"
          size="sm"
        >
          <Video className="h-4 w-4 mr-2" />
          Start Stream
        </Button>
      ) : (
        <Button
          onClick={onStopStream}
          className="bg-red-600 hover:bg-red-700 text-white"
          size="sm"
        >
          <Square className="h-4 w-4 mr-2" />
          Stop Stream
        </Button>
      )}

      {/* Video/Audio Controls (only show when streaming) */}
      {isStreaming && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleVideo}
            className="text-white hover:bg-white/20"
          >
            {isLive ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleAudio}
            className="text-white hover:bg-white/20"
          >
            {isLive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>
        </>
      )}

      {/* Viewer Count */}
      <div className="flex items-center gap-1 text-white text-sm ml-auto">
        <Users className="h-4 w-4" />
        <span>{viewerCount} watching</span>
      </div>

      {/* Settings */}
      {onSettings && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onSettings}
          className="text-white hover:bg-white/20"
        >
          <Settings className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export default LivestreamControls
