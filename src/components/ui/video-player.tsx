"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { Play, Pause, Volume2, VolumeX, Maximize, Forward, Trash2 } from 'lucide-react'

interface VideoPlayerProps {
  videoUrl: string
  thumbnailUrl?: string | null
  title: string
  videoId: string
  onForward?: () => void
  isOwner?: boolean
  onDelete?: () => void
}

export function VideoPlayer({ videoUrl, thumbnailUrl, title, videoId, onForward, isOwner = false, onDelete }: VideoPlayerProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showForwardDialog, setShowForwardDialog] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState('')
  const [rooms, setRooms] = useState<Array<{ id: string; name: string }>>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoRef.current.requestFullscreen()
      }
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const loadUserRooms = async () => {
    if (!session?.user?.id) return
    
    setIsLoadingRooms(true)
    try {
      const response = await fetch('/api/rooms')
      if (response.ok) {
        const data = await response.json()
        const userRooms = data.rooms.filter((room: { isMember: boolean }) => room.isMember)
        setRooms(userRooms)
      }
    } catch (error) {
      console.error('Failed to load rooms:', error)
      toast({
        title: "Error",
        description: "Failed to load your rooms",
        variant: "destructive"
      })
    } finally {
      setIsLoadingRooms(false)
    }
  }

  const forwardVideo = async () => {
    if (!selectedRoom || !session?.user?.id) return

    try {
      const response = await fetch('/api/videos/forward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          targetRoomId: selectedRoom,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Video forwarded successfully!",
        })
        setShowForwardDialog(false)
        setSelectedRoom('')
        onForward?.()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to forward video')
      }
    } catch (error) {
      console.error('Error forwarding video:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to forward video",
        variant: "destructive"
      })
    }
  }

  const handleDeleteVideo = async () => {
    if (!isOwner || !session?.user?.id) return

    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Video deleted successfully!",
        })
        onDelete?.()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete video')
      }
    } catch (error) {
      console.error('Error deleting video:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete video",
        variant: "destructive"
      })
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
    setShowContextMenu(true)
  }

  const handleLongPress = () => {
    // For mobile devices, show context menu on long press
    if (isOwner) {
      setShowContextMenu(true)
    }
  }

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowContextMenu(false)
    }

    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showContextMenu])

  return (
    <div className="relative group">
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-auto rounded-lg cursor-pointer"
        poster={thumbnailUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
        onContextMenu={handleContextMenu}
        onTouchStart={() => {
          // Start long press timer for mobile
          const timer = setTimeout(() => handleLongPress(), 500)
          const cleanup = () => clearTimeout(timer)
          document.addEventListener('touchend', cleanup, { once: true })
          document.addEventListener('touchmove', cleanup, { once: true })
        }}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Video Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Progress Bar */}
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`
          }}
        />
        
        {/* Control Buttons */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Dialog open={showForwardDialog} onOpenChange={setShowForwardDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadUserRooms}
                  className="text-white hover:bg-white/20"
                >
                  <Forward className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Forward Video to Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Select Room</label>
                    <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a room" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingRooms ? (
                          <SelectItem value="" disabled>Loading rooms...</SelectItem>
                        ) : rooms.length === 0 ? (
                          <SelectItem value="" disabled>No rooms available</SelectItem>
                        ) : (
                          rooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowForwardDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={forwardVideo}
                      disabled={!selectedRoom}
                    >
                      Forward Video
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Video Title */}
      <div className="mt-2">
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>

      {/* Context Menu */}
      {showContextMenu && isOwner && (
        <div 
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-[150px]"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
          }}
        >
          <button
            onClick={handleDeleteVideo}
            className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Video
          </button>
        </div>
      )}
    </div>
  )
}
