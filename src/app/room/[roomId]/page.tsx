"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col">
      {/* Room Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 w-8 h-8 sm:w-10 sm:h-10"
              onClick={handleBackToDashboard}
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">{roomInfo.name}</h1>
              <p className="text-xs sm:text-sm text-gray-300">{roomInfo.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-1 sm:gap-2">
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
            
            <div className="flex items-center gap-1 sm:gap-2 text-white">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">{roomInfo.memberCount} online</span>
            </div>
            
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 w-8 h-8 sm:w-10 sm:h-10">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
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
                            {new Date(message.createdAt).toLocaleTimeString()}
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

        {/* Message Input */}
        <div className="p-3 sm:p-4 border-t border-white/20">
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
                  <X className="w-4 h-4" />
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

          <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={isConnected ? "Type your message..." : "Connecting..."}
                disabled={!isConnected}
                className="bg-white/20 border-white/30 text-white placeholder:text-gray-400 pr-20 sm:pr-24 text-sm sm:text-base py-2 sm:py-3 disabled:opacity-50"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFileUpload(!showFileUpload)}
                  className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 hover:text-white"
                  disabled={!isConnected}
                  title="Attach file"
                >
                  <Paperclip className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 hover:text-white"
                  disabled={!isConnected}
                >
                  <Smile className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 hover:text-white"
                  disabled={!isConnected}
                >
                  <Video className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 hover:text-white"
                  disabled={!isConnected}
                >
                  <Mic className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 px-3 sm:px-6 py-2 sm:py-3 disabled:opacity-50"
              disabled={!newMessage.trim() || !isConnected}
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
