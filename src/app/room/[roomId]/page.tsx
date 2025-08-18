"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/ui/file-upload'
import { 
  ArrowLeft, 
  Users, 
  Settings, 
  Send, 
  Smile, 
  Video, 
  Mic,
  Wifi,
  WifiOff,
  Loader2,
  Paperclip,
  X
} from 'lucide-react'
import { useSocket } from '@/hooks/use-socket'
import { useLivestream } from '@/hooks/use-livestream'
import { LivestreamVideoPlayer } from '@/components/ui/livestream-video-player'
import { LivestreamControls } from '@/components/ui/livestream-controls'
import { ChatMessage } from '@/lib/socket-server'

interface RoomInfo {
  name: string
  description: string
  memberCount: number
}

export default function ChatRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const [roomId, setRoomId] = useState<string>('')
  
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setRoomId(resolvedParams.roomId)
    }
    resolveParams()
  }, [params])
  
  if (!roomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading chat room...</p>
        </div>
      </div>
    )
  }
  
  return <ChatRoomClient roomId={roomId} />
}

function ChatRoomClient({ roomId }: { roomId: string }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [newMessage, setNewMessage] = useState('')
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [roomInfo] = useState<RoomInfo>({
    name: roomId && roomId.length > 0 ? roomId.charAt(0).toUpperCase() + roomId.slice(1) : 'Chat Room',
    description: `Welcome to the ${roomId || 'chat'} room!`,
    memberCount: 0
  })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Use our Socket.IO hook
  const {
    isConnected,
    messages,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping
  } = useSocket(roomId)

  // Use our Livestream hook
  const {
    isLive,
    isStreaming,
    isViewing,
    streamerId,
    streamerName,
    viewerCount,
    localTracks,
    remoteUsers,
    startStream,
    stopStream,
    joinStream,
    leaveStream,
    toggleVideo,
    toggleAudio
  } = useLivestream(roomId)

  // Auto-start livestream when navigated with ?goLive=1
  const autoGoLive = searchParams?.get('goLive') === '1'
  const attemptedAutoGoLiveRef = useRef(false)

  useEffect(() => {
    if (autoGoLive && !attemptedAutoGoLiveRef.current && !isStreaming && status === 'authenticated') {
      attemptedAutoGoLiveRef.current = true
      startStream().catch(() => {
        // ignore auto start errors
      })
    }
  }, [autoGoLive, isStreaming, status, startStream])

  // Handle invite parameter
  const inviteParam = searchParams?.get('invite')
  const [inviteNotification, setInviteNotification] = useState<string | null>(null)

  useEffect(() => {
    if (inviteParam && session?.user) {
      // Show invite notification
      setInviteNotification(`You've been invited to this room!`)
      // Clear the invite param from URL after showing notification
      const url = new URL(window.location.href)
      url.searchParams.delete('invite')
      window.history.replaceState({}, '', url.toString())
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => setInviteNotification(null), 5000)
    }
  }, [inviteParam, session?.user])

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  // Handle send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !isConnected) return

    sendMessage(newMessage, roomId)
    setNewMessage('')
    
    // Focus back to input
    inputRef.current?.focus()
  }

  // Handle input change with typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewMessage(value)
    
    if (value.length > 0) {
      startTyping(roomId)
    } else {
      stopTyping(roomId)
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      setUploadingFile(true)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('roomId', roomId)
      formData.append('messageType', file.type.startsWith('image/') ? 'image' : 
                                    file.type.startsWith('video/') ? 'video' : 
                                    file.type.startsWith('audio/') ? 'audio' : 'file')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      
      // Send file message via Socket.IO
      sendMessage(
        `📎 ${file.name}`, 
        roomId, 
        file.type.startsWith('image/') ? 'image' : 
        file.type.startsWith('video/') ? 'video' : 
        file.type.startsWith('audio/') ? 'audio' : 'file'
      )

      // Add file info to the message
      const fileMessage = {
        content: `📎 ${file.name}`,
        fileUrl: result.file.url,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        messageType: file.type.startsWith('image/') ? 'image' : 
                    file.type.startsWith('video/') ? 'video' : 
                    file.type.startsWith('audio/') ? 'audio' : 'file'
      }

      console.log('File uploaded:', fileMessage)
      setShowFileUpload(false)
      
    } catch (error) {
      console.error('File upload error:', error)
      alert('File upload failed. Please try again.')
    } finally {
      setUploadingFile(false)
    }
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading chat room...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!session) {
    return null
  }

  return (
    <div className="h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col overflow-hidden">
      {/* Room Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-3 sm:p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 w-8 h-8 sm:w-10 sm:h-10"
              onClick={handleBackToDashboard}
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:w-5" />
            </Button>
            
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-white truncate">{roomInfo.name}</h1>
              <p className="text-xs sm:text-sm text-gray-300 truncate">{roomInfo.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Connection Status */}
            <div className="hidden sm:flex items-center gap-1 sm:gap-2">
              {isConnected ? (
                <Wifi className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
              ) : (
                <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
              )}
              <Badge 
                variant={isConnected ? "default" : "destructive"}
                className="text-xs"
              >
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            
            <div className="hidden sm:flex items-center gap-1 sm:gap-2 text-white">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">{roomInfo.memberCount} online</span>
            </div>
            
            {/* Stream Status */}
            {isLive && (
              <div className="hidden sm:flex items-center gap-1 sm:gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm text-red-400 font-medium">LIVE</span>
                {viewerCount > 0 && (
                  <span className="text-xs text-gray-300">({viewerCount} watching)</span>
                )}
              </div>
            )}
            
            {/* Start Stream Button */}
            {!isStreaming && (
              <Button
                onClick={startStream}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-sm"
                size="sm"
              >
                <Video className="w-4 h-4 mr-2" />
                Go Live
              </Button>
            )}
            
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 w-8 h-8 sm:w-10 sm:h-10">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Invite Notification */}
      {inviteNotification && (
        <div className="bg-blue-600 text-white px-4 py-3 text-center animate-pulse">
          <p className="text-sm font-medium">{inviteNotification}</p>
        </div>
      )}

      {/* Chat Area - Fixed height container */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Livestream Video Area */}
        {(isStreaming || isLive) && (
          <div className="p-3 sm:p-4 border-b border-white/20 bg-white/5">
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-white mb-2">
                {isStreaming ? 'Your Stream' : `${streamerName}'s Stream`}
              </h3>
              
              {/* Livestream Controls */}
              <LivestreamControls
                isStreaming={isStreaming}
                isLive={isLive}
                viewerCount={viewerCount}
                onStartStream={startStream}
                onStopStream={stopStream}
                onToggleVideo={toggleVideo}
                onToggleAudio={toggleAudio}
              />
            </div>

            {/* Video Display */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Local Stream (if streaming) */}
              {isStreaming && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Your Camera</h4>
                  <LivestreamVideoPlayer
                    videoTrack={localTracks.video}
                    audioTrack={localTracks.audio}
                    className="w-full h-48 lg:h-64 rounded-lg"
                  />
                </div>
              )}

              {/* Remote Streams (if viewing) */}
              {remoteUsers.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Other Streamers</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {remoteUsers.map(user => (
                      <LivestreamVideoPlayer
                        key={user.uid}
                        videoTrack={user.videoTrack}
                        audioTrack={user.audioTrack}
                        className="w-full h-32 rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Join Stream Button (if not streaming but stream is live) */}
            {!isStreaming && isLive && !isViewing && (
              <div className="mt-4 text-center">
                <Button
                  onClick={joinStream}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Join Stream
                </Button>
              </div>
            )}

            {/* Leave Stream Button (if viewing) */}
            {isViewing && (
              <div className="mt-4 text-center">
                <Button
                  onClick={leaveStream}
                  variant="outline"
                  className="text-white border-white/30 hover:bg-white/10"
                  size="sm"
                >
                  Leave Stream
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Messages - Scrollable area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-6 sm:py-8">
              <p className="text-sm sm:text-base">
                {isConnected ? "No messages yet. Start the conversation!" : "Connecting to chat..."}
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {messages.map((message: ChatMessage) => (
                <div key={message.id} className={`flex items-start gap-2 sm:gap-3 ${
                  message.userId === 'system' ? 'justify-center' : ''
                }`}>
                  {message.userId === 'system' ? (
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                      <p className="text-gray-300 text-xs sm:text-sm text-center">{message.content}</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold flex-shrink-0">
                        {(message.displayName?.charAt(0) || message.username?.charAt(0) || '?').toUpperCase()}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 sm:gap-2 mb-1">
                          <span className="font-semibold text-white text-sm sm:text-base truncate">
                            {message.displayName || message.username || 'Unknown'}
                          </span>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : 'Just now'}
                          </span>
                        </div>
                        <p className="text-white text-sm sm:text-base break-words">{message.content}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
              
              {/* Typing indicators */}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm italic">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
                </div>
              )}
              
              {/* Auto-scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input - Fixed at bottom */}
        <div className="border-t border-white/20 bg-white/5 backdrop-blur-sm p-2 sm:p-3 md:p-4 flex-shrink-0">
          {/* File Upload Section */}
          {showFileUpload && (
            <div className="mb-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white">Upload File</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFileUpload(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <FileUpload
                onFileSelect={handleFileUpload}
                maxFileSize={50}
                allowedTypes={['image/*', 'video/*', 'audio/*', 'application/*']}
                disabled={uploadingFile}
                className="text-white"
              />
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3 items-end">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={isConnected ? "Type your message..." : "Connecting..."}
                disabled={!isConnected}
                className="bg-white/20 border-white/30 text-white placeholder:text-gray-400 pr-16 sm:pr-20 md:pr-24 text-sm sm:text-base py-2 sm:py-3 disabled:opacity-50"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFileUpload(!showFileUpload)}
                  className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-400 hover:text-white"
                  disabled={!isConnected}
                  title="Attach file"
                >
                  <Paperclip className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-400 hover:text-white"
                  disabled={!isConnected}
                >
                  <Smile className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-400 hover:text-white"
                  disabled={!isConnected}
                >
                  <Video className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-400 hover:text-white"
                  disabled={!isConnected}
                >
                  <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 px-3 sm:px-6 py-2 sm:py-3 disabled:opacity-50 flex-shrink-0"
              disabled={!newMessage.trim() || !isConnected}
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
