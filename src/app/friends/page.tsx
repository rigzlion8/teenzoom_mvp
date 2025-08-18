"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, UserPlus, Users, UserCheck, UserX, MessageCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Friend {
  id: string
  username: string
  displayName: string
  isOnline: boolean
  lastSeen: string
  level: number
  xp: number
}

interface FriendRequest {
  id: string
  fromUser: {
    id: string
    username: string
    displayName: string
    level: number
  }
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

interface SearchResult {
  id: string
  username: string
  displayName: string
  level: number
}

export default function FriendsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchFriends()
      fetchFriendRequests()
    }
  }, [session])

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/friends')
      if (response.ok) {
        const data = await response.json()
        setFriends(data.friends)
      }
    } catch (error) {
      console.error('Error fetching friends:', error)
    }
  }

  const fetchFriendRequests = async () => {
    try {
      const response = await fetch('/api/friends/requests')
      if (response.ok) {
        const data = await response.json()
        setFriendRequests(data.requests)
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error)
    }
  }

  const searchUsers = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.users)
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendFriendRequest = async (userId: string) => {
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      
      if (response.ok) {
        toast({
          title: "Friend Request Sent",
          description: "Your friend request has been sent successfully!",
        })
        setSearchResults([])
        setSearchQuery('')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send friend request. Please try again.",
        variant: "destructive"
      })
    }
  }

  const respondToFriendRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch(`/api/friends/request/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      if (response.ok) {
        toast({
          title: action === 'accept' ? "Friend Request Accepted" : "Friend Request Rejected",
          description: action === 'accept' 
            ? "You are now friends!" 
            : "Friend request has been rejected.",
        })
        fetchFriendRequests()
        fetchFriends()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process friend request. Please try again.",
        variant: "destructive"
      })
    }
  }

  const removeFriend = async (friendId: string) => {
    try {
      const response = await fetch(`/api/friends/${friendId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast({
          title: "Friend Removed",
          description: "Friend has been removed from your list.",
        })
        fetchFriends()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove friend. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Friends</h1>
        <p className="text-muted-foreground text-center">Connect with other teens on TeenZoom</p>
      </div>

      {/* Search Users */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find New Friends
          </CardTitle>
          <CardDescription>
            Search for users by username or display name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter username or display name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
            />
            <Button onClick={searchUsers} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.displayName}</p>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => sendFriendRequest(user.id)}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Friend
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Friend Requests ({friendRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {friendRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{request.fromUser.displayName}</p>
                    <p className="text-sm text-muted-foreground">@{request.fromUser.username}</p>
                    <Badge variant="secondary">Level {request.fromUser.level}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => respondToFriendRequest(request.id, 'accept')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => respondToFriendRequest(request.id, 'reject')}
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Friends List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Friends ({friends.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {friends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No friends yet. Start searching for new friends above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                        {friend.displayName.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                        friend.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">{friend.displayName}</p>
                      <p className="text-sm text-muted-foreground">@{friend.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">Level {friend.level}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {friend.isOnline ? 'Online' : `Last seen ${new Date(friend.lastSeen).toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFriend(friend.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
