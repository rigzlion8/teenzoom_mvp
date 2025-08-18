"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, UserPlus, Users, UserCheck, UserX, MessageCircle, Video } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { DirectMessage } from '@/components/direct-message'

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
  const router = useRouter()
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showGoLiveDialog, setShowGoLiveDialog] = useState(false)
  const [liveTargetFriend, setLiveTargetFriend] = useState<Friend | null>(null)
  const [rooms, setRooms] = useState<Array<{ id: string; roomId: string; name: string }>>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState('')

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

  const openGoLiveWithFriend = async (friend: Friend) => {
    setLiveTargetFriend(friend)
    setShowGoLiveDialog(true)
    setSelectedRoomId('')
    await loadUserRooms()
  }

  type ApiRoom = { id: string; roomId: string; name: string; isMember?: boolean }

  const loadUserRooms = async () => {
    try {
      setIsLoadingRooms(true)
      const response = await fetch('/api/rooms')
      if (response.ok) {
        const data = await response.json()
        // Expecting data.rooms: { id, roomId, name, isMember }
        const roomsFromApi: ApiRoom[] = Array.isArray(data.rooms) ? data.rooms : []
        const userRooms = roomsFromApi
          .filter((r) => !!r.isMember)
          .map((r) => ({ id: r.id, roomId: r.roomId, name: r.name }))
        setRooms(userRooms)
      }
    } catch (error) {
      console.error('Failed to load rooms', error)
    } finally {
      setIsLoadingRooms(false)
    }
  }

  const startLiveInSelectedRoom = () => {
    if (!selectedRoomId) return
    const room = rooms.find(r => r.id === selectedRoomId)
    if (!room) return
    // Navigate to room with goLive flag and optional invite param
    const invite = liveTargetFriend?.id ? `&invite=${liveTargetFriend.id}` : ''
    router.push(`/room/${room.roomId}?goLive=1${invite}`)
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Friends</h1>
          <p className="text-gray-300 text-lg">Connect with other teens on TeenZoom</p>
        </div>

        {/* Search Users */}
        <Card className="mb-8 bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Search className="h-5 w-5" />
              Find New Friends
            </CardTitle>
            <CardDescription className="text-gray-300">
              Search for users by username or display name
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Enter username or display name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                className="flex-1"
              />
              <Button onClick={searchUsers} disabled={loading} className="w-full sm:w-auto">
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-3">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-white/20 rounded-lg bg-white/5">
                    <div className="mb-3 sm:mb-0">
                      <p className="font-medium text-white">{user.displayName}</p>
                      <p className="text-sm text-gray-300">@{user.username}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => sendFriendRequest(user.id)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2"
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
          <Card className="mb-8 bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <UserPlus className="h-5 w-5" />
                Friend Requests ({friendRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {friendRequests.map((request) => (
                  <div key={request.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-white/20 rounded-lg bg-white/5">
                    <div className="mb-3 sm:mb-0">
                      <p className="font-medium text-white">{request.fromUser.displayName}</p>
                      <p className="text-sm text-gray-300">@{request.fromUser.username}</p>
                      <Badge variant="secondary" className="mt-1">Level {request.fromUser.level}</Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        size="sm"
                        onClick={() => respondToFriendRequest(request.id, 'accept')}
                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => respondToFriendRequest(request.id, 'reject')}
                        className="w-full sm:w-auto"
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
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5" />
              Your Friends ({friends.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {friends.length === 0 ? (
              <div className="text-center py-8 text-gray-300">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No friends yet. Start searching for new friends above!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-white/20 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3 mb-3 sm:mb-0">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {friend.displayName.charAt(0)}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                          friend.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-white">{friend.displayName}</p>
                        <p className="text-sm text-gray-300">@{friend.username}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                          <Badge variant="outline" className="w-fit">Level {friend.level}</Badge>
                          <span className="text-xs text-gray-400">
                            {friend.isOnline ? 'Online' : `Last seen ${new Date(friend.lastSeen).toLocaleDateString()}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {friend.isOnline && (
                        <Button
                          size="sm"
                          onClick={() => openGoLiveWithFriend(friend)}
                          className="bg-green-600 hover:bg-green-700 w-full sm:w-auto flex items-center gap-2"
                        >
                          <Video className="h-4 w-4" />
                          Go Live
                        </Button>
                      )}
                      <DirectMessage
                        friendId={friend.id}
                        friendName={friend.displayName || friend.username}
                        friendUsername={friend.username}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFriend(friend.id)}
                        className="text-red-600 hover:text-red-700 border-red-600 hover:bg-red-600 hover:text-white w-full sm:w-auto"
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
        
        {/* Go Live Dialog */}
        <Dialog open={showGoLiveDialog} onOpenChange={setShowGoLiveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Go Live {liveTargetFriend ? `with ${liveTargetFriend.displayName}` : ''}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">Choose a room to start your livestream in:</p>
                <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingRooms ? 'Loading rooms...' : 'Select a room'} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingRooms ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : rooms.length === 0 ? (
                      <SelectItem value="none" disabled>No rooms found</SelectItem>
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
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowGoLiveDialog(false)}>Cancel</Button>
                <Button onClick={startLiveInSelectedRoom} disabled={!selectedRoomId} className="bg-green-600 hover:bg-green-700">
                  <Video className="h-4 w-4 mr-2" /> Start Live
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
