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
  UserPlus
} from 'lucide-react'

interface Friend {
  id: string
  username: string
  displayName: string
  isOnline: boolean
  lastSeen: string
  unreadCount?: number
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [friends, setFriends] = useState<Friend[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const loadFriends = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/friends')
      
      if (response.ok) {
        const data = await response.json()
        setFriends(data.friends)
      } else {
        throw new Error('Failed to load friends')
      }
    } catch (error) {
      console.error('Error loading friends:', error)
      toast({
        title: "Error",
        description: "Failed to load friends",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (session?.user?.id) {
      loadFriends()
    }
  }, [session?.user?.id, loadFriends])

  const filteredFriends = friends.filter(friend =>
    friend.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
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
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-white/20 text-white">
              <Users className="h-4 w-4 mr-1" />
              {friends.length} Friends
            </Badge>
            <Badge variant="secondary" className="bg-green-500/20 text-green-300">
              {friends.filter(f => f.isOnline).length} Online
            </Badge>
          </div>
        </div>

        {/* Friends List */}
        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Loading friends...</p>
            </div>
          ) : filteredFriends.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="text-center py-12">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400 opacity-50" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {searchQuery ? 'No friends found' : 'No friends yet'}
                </h3>
                <p className="text-gray-300 mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Add some friends to start messaging!'
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
            filteredFriends.map((friend) => (
              <Card key={friend.id} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {friend.displayName?.charAt(0) || friend.username.charAt(0)}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          friend.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                      </div>

                      {/* Friend Info */}
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {friend.displayName || friend.username}
                        </h3>
                        <p className="text-gray-300">@{friend.username}</p>
                        <p className="text-sm text-gray-400">
                          {friend.isOnline ? 'Online now' : `Last seen ${formatLastSeen(friend.lastSeen)}`}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      {friend.unreadCount && friend.unreadCount > 0 && (
                        <Badge variant="destructive" className="bg-red-500">
                          {friend.unreadCount}
                        </Badge>
                      )}
                      <DirectMessage
                        friendId={friend.id}
                        friendName={friend.displayName || friend.username}
                        friendUsername={friend.username}
                      />
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
    </div>
  )
}
