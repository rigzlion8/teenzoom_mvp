"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { FileUpload } from '@/components/ui/file-upload'
import { useToast } from '@/hooks/use-toast'
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  File, 
  X
} from 'lucide-react'

interface DirectMessageProps {
  friendId: string
  friendName: string
  friendUsername: string
}

interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file'
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileType?: string
  createdAt: string
  sender: {
    id: string
    username: string
    displayName: string
  }
  receiver: {
    id: string
    username: string
    displayName: string
  }
}

export function DirectMessage({ friendId, friendName, friendUsername }: DirectMessageProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = useCallback(async () => {
    if (!session?.user?.id) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/messages/direct?friendId=${friendId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      } else {
        throw new Error('Failed to load messages')
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, friendId, toast])

  // Load messages when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadMessages()
    }
  }, [isOpen, loadMessages])

  const sendMessage = async (content: string, messageType: 'text' | 'image' | 'video' | 'audio' | 'file' = 'text', fileData?: {
    url: string
    name: string
    size: number
    type: string
  }) => {
    if (!session?.user?.id || !content.trim()) return

    try {
      const messageData = {
        receiverId: friendId,
        content,
        messageType,
        ...(fileData && {
          fileUrl: fileData.url,
          fileName: fileData.name,
          fileSize: fileData.size,
          fileType: fileData.type
        })
      }

      const response = await fetch('/api/messages/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      })

      if (response.ok) {
        const newMessage = await response.json()
        setMessages(prev => [...prev, newMessage.message])
        setNewMessage('')
        setShowFileUpload(false)
        
        // Focus back to input
        inputRef.current?.focus()
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      })
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    sendMessage(newMessage)
  }

  const handleFileUpload = async (file: File) => {
    try {
      setUploadingFile(true)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'direct-message')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      
      // Send file message
      const messageType = file.type.startsWith('image/') ? 'image' : 
                         file.type.startsWith('video/') ? 'video' : 
                         file.type.startsWith('audio/') ? 'audio' : 'file'
      
      sendMessage(`📎 ${file.name}`, messageType, {
        url: result.file.url,
        name: file.name,
        size: file.size,
        type: file.type
      })
      
    } catch (error) {
      console.error('File upload error:', error)
      toast({
        title: "Error",
        description: "File upload failed. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploadingFile(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const renderMessageContent = (message: Message) => {
    switch (message.messageType) {
      case 'image':
        return (
          <div className="max-w-xs">
            <img 
              src={message.fileUrl} 
              alt={message.fileName || 'Image'} 
              className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.fileUrl, '_blank')}
            />
            <p className="text-sm text-gray-600 mt-1">{message.content}</p>
          </div>
        )
      
      case 'video':
        return (
          <div className="max-w-xs">
            <video 
              controls 
              className="rounded-lg max-w-full h-auto"
              poster={message.fileUrl?.replace(/\.[^/.]+$/, '.jpg')}
            >
              <source src={message.fileUrl} type={message.fileType} />
              Your browser does not support the video tag.
            </video>
            <p className="text-sm text-gray-600 mt-1">{message.content}</p>
          </div>
        )
      
      case 'audio':
        return (
          <div className="max-w-xs">
            <audio controls className="w-full">
              <source src={message.fileUrl} type={message.fileType} />
              Your browser does not support the audio tag.
            </audio>
            <p className="text-sm text-gray-600 mt-1">{message.content}</p>
          </div>
        )
      
      case 'file':
        return (
          <div className="max-w-xs">
            <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
              <File className="h-5 w-5 text-gray-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{message.fileName}</p>
                <p className="text-xs text-gray-500">
                  {(message.fileSize! / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(message.fileUrl, '_blank')}
              >
                Download
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-1">{message.content}</p>
          </div>
        )
      
      default:
        return <p className="text-gray-900">{message.content}</p>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
          <MessageSquare className="h-4 w-4 mr-2" />
          Message
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-2xl h-[80vh] sm:h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
            Message {friendName} (@{friendUsername})
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.senderId === session?.user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.senderId !== session?.user?.id && (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold flex-shrink-0">
                      {message.sender.displayName?.charAt(0) || message.sender.username?.charAt(0) || '?'}
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80vw] sm:max-w-xs ${
                      message.senderId === session?.user?.id
                        ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg'
                        : 'bg-white text-gray-900 rounded-r-lg rounded-tl-lg border'
                    } p-2 sm:p-3`}
                  >
                    {renderMessageContent(message)}
                    <p className={`text-xs mt-1 ${
                      message.senderId === session?.user?.id ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                  
                  {message.senderId === session?.user?.id && (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold flex-shrink-0">
                      {session.user.displayName?.charAt(0) || session.user.username?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* File Upload Section */}
          {showFileUpload && (
            <div className="p-3 bg-gray-100 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Upload File</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFileUpload(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <FileUpload
                onFileSelect={handleFileUpload}
                maxFileSize={50}
                allowedTypes={['image/*', 'video/*', 'audio/*', 'application/*']}
                disabled={uploadingFile}
              />
            </div>
          )}

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="flex flex-col sm:flex-row gap-2 pt-4">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="pr-20"
                disabled={uploadingFile}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFileUpload(!showFileUpload)}
                  className="w-6 h-6 text-gray-500 hover:text-gray-700"
                  disabled={uploadingFile}
                  title="Attach file"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 px-6 w-full sm:w-auto"
              disabled={!newMessage.trim() || uploadingFile}
            >
              <Send className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
