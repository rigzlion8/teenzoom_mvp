"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Users, 
  Lock, 
  Globe, 
  Plus, 
  Gamepad2, 
  Music, 
  BookOpen, 
  Heart, 
  Star,
  TrendingUp,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface Room {
  id: string
  name: string
  description: string
  category: string
  privacy: 'public' | 'friends' | 'private'
  memberCount: number
  maxMembers: number
  isActive: boolean
  tags: string[]
  createdAt: string
  lastActivity: string
  owner: {
    id: string
    username: string
    displayName: string
  }
  isMember?: boolean
}

const roomCategories = [
  { id: 'trending', name: 'Trending', icon: TrendingUp, color: 'bg-red-500' },
  { id: 'gaming', name: 'Gaming', icon: Gamepad2, color: 'bg-purple-500' },
  { id: 'music', name: 'Music', icon: Music, color: 'bg-pink-500' },
  { id: 'study', name: 'Study', icon: BookOpen, color: 'bg-blue-500' },
  { id: 'social', name: 'Social', icon: Users, color: 'bg-green-500' },
  { id: 'creative', name: 'Creative', icon: Heart, color: 'bg-red-500' },
  { id: 'general', name: 'General', icon: Star, color: 'bg-yellow-500' },
]

export default function RoomsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])

  useEffect(() => {
    fetchRooms()
  }, [])

  const filterRooms = useCallback(() => {
    let filtered = rooms

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(room => room.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(room => 
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    setFilteredRooms(filtered)
  }, [rooms, selectedCategory, searchQuery])

  useEffect(() => {
    filterRooms()
  }, [filterRooms])

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms')
      if (response.ok) {
        const data = await response.json()
        setRooms(data.rooms)
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const joinRoom = async (roomId: string) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: "Joined Room!",
          description: "You have successfully joined the room.",
        })
        fetchRooms() // Refresh to update member status
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to join room",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join room. Please try again.",
        variant: "destructive"
      })
    }
  }

  const leaveRoom = async (roomId: string) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/leave`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: "Left Room",
          description: "You have left the room.",
        })
        fetchRooms() // Refresh to update member status
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to leave room. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'public': return <Globe className="h-4 w-4" />
      case 'friends': return <Users className="h-4 w-4" />
      case 'private': return <Lock className="h-4 w-4" />
      default: return <Globe className="h-4 w-4" />
    }
  }

  const getPrivacyColor = (privacy: string) => {
    switch (privacy) {
      case 'public': return 'bg-green-500'
      case 'friends': return 'bg-blue-500'
      case 'private': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return `${Math.floor(diffInHours / 168)}w ago`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading rooms...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Chat Rooms</h1>
        <p className="text-muted-foreground text-center">Join exciting conversations and meet new friends</p>
      </div>

      {/* Create Room Button */}
      {session?.user && (
        <div className="mb-6 text-center">
          <Link href="/rooms/create">
            <Button size="lg" className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Room
            </Button>
          </Link>
        </div>
      )}

      {/* Search and Categories */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Input
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All Rooms
          </Button>
          {roomCategories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-2"
            >
              <category.icon className="h-4 w-4" />
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => (
          <Card key={room.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-5 w-5" />
                    {room.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {room.description}
                  </CardDescription>
                </div>
                <Badge className={getPrivacyColor(room.privacy)}>
                  {getPrivacyIcon(room.privacy)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {/* Room Stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {room.memberCount}/{room.maxMembers} members
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatTimeAgo(room.lastActivity)}
                  </span>
                </div>

                {/* Tags */}
                {room.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {room.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {room.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{room.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Owner Info */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Created by:</span>
                  <span className="font-medium">@{room.owner.username}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {room.isMember ? (
                    <>
                      <Link href={`/room/${room.id}`} className="flex-1">
                        <Button className="w-full">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Enter Room
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => leaveRoom(room.id)}
                      >
                        Leave
                      </Button>
                    </>
                  ) : (
                    <Button 
                      className="w-full"
                      onClick={() => joinRoom(room.id)}
                      disabled={room.memberCount >= room.maxMembers}
                    >
                      {room.memberCount >= room.maxMembers ? 'Room Full' : 'Join Room'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No rooms found</p>
          <p className="text-sm">Try adjusting your search or category filters</p>
        </div>
      )}
    </div>
  )
}
