"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DirectMessage } from '@/components/direct-message'
import { useToast } from '@/hooks/use-toast'
import { 
  MessageSquare, 
  Search, 
  Users, 
  UserPlus,
  Bell,
  Clock
} from 'lucide-react'

interface Conversation {
  friend: {
    id: string
    username: string
    displayName: string
    isOnline: boolean
    lastSeen: string
  }
  lastMessage: {
    id: string
    content: string
    messageType: 'text' | 'image' | 'video' | 'audio' | 'file'
    createdAt: string
    senderId: string
    sender: {
      id: string
      username: string
      displayName: string
    }
  } | null
  unreadCount: number
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)

  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/messages/conversations')
      
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations)
      } else {
        throw new Error('Failed to load conversations')
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (session?.user?.id) {
      loadConversations()
      
      // Refresh conversations every 30 seconds
      const interval = setInterval(loadConversations, 30000)
      return () => clearInterval(interval)
    }
  }, [session?.user?.id, loadConversations])

  const filteredConversations = conversations.filter(conversation =>
    conversation.friend.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conversation.lastMessage?.content && 
     conversation.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'now'
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return date.toLocaleDateString()
  }

  const getMessagePreview = (message: Conversation['lastMessage']) => {
    if (!message) return 'No messages yet'
    
    switch (message.messageType) {
      case 'image':
        return '📷 Image'
      case 'video':
        return '🎥 Video'
      case 'audio':
        return '🎵 Audio'
      case 'file':
        return '📎 File'
      default:
        return message.content.length > 50 
          ? message.content.substring(0, 50) + '...'
          : message.content
    }
  }

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation)
  }

  const handleCloseConversation = () => {
    setSelectedConversation(null)
    // Refresh conversations to update unread counts
    loadConversations()
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl">Please sign in to view messages</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Direct Messages</h1>
          <p className="text-gray-300 text-lg">Chat privately with your friends</p>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-white/20 text-white">
              <Users className="h-4 w-4 mr-1" />
              {conversations.length} Conversations
            </Badge>
            <Badge variant="secondary" className="bg-green-500/20 text-green-300">
              {conversations.filter(c => c.friend.isOnline).length} Online
            </Badge>
          </div>
        </div>

        {/* Conversations List */}
        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="text-center py-12">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400 opacity-50" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </h3>
                <p className="text-gray-300 mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Start messaging your friends to see conversations here!'
                  }
                </p>
                {!searchQuery && (
                  <Button asChild>
                    <a href="/friends">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Find Friends
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredConversations.map((conversation) => (
              <Card 
                key={conversation.friend.id} 
                className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
                onClick={() => handleConversationClick(conversation)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {conversation.friend.displayName?.charAt(0) || conversation.friend.username.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        conversation.friend.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {conversation.friend.displayName || conversation.friend.username}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Notification Bell */}
                          {conversation.unreadCount > 0 && (
                            <div className="relative">
                              <Bell className="h-4 w-4 text-yellow-400" />
                              <Badge 
                                variant="destructive" 
                                className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center bg-red-500"
                              >
                                {conversation.unreadCount}
                              </Badge>
                            </div>
                          )}
                          
                          {/* Message Time */}
                          {conversation.lastMessage && (
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Clock className="h-3 w-3" />
                              {formatMessageTime(conversation.lastMessage.createdAt)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-300 text-sm mb-1">@{conversation.friend.username}</p>
                      
                      {/* Last Message Preview */}
                      {conversation.lastMessage ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {conversation.lastMessage.senderId === session.user.id ? 'You:' : `${conversation.lastMessage.sender.displayName || conversation.lastMessage.sender.username}:`}
                          </span>
                          <p className="text-sm text-gray-300 truncate">
                            {getMessagePreview(conversation.lastMessage)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No messages yet</p>
                      )}
                      
                      {/* Online Status */}
                      <p className="text-xs text-gray-400 mt-1">
                        {conversation.friend.isOnline ? 'Online now' : `Last seen ${formatLastSeen(conversation.friend.lastSeen)}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 text-center">
          <Button asChild variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <a href="/friends">
              <UserPlus className="h-4 w-4 mr-2" />
              Manage Friends
            </a>
          </Button>
        </div>
      </div>

      {/* Conversation Dialog */}
      {selectedConversation && (
        <DirectMessage
          friendId={selectedConversation.friend.id}
          friendName={selectedConversation.friend.displayName || selectedConversation.friend.username}
          friendUsername={selectedConversation.friend.username}
          isOpen={true}
          onClose={handleCloseConversation}
        />
      )}
    </div>
  )
}
