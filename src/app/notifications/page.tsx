"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Bell, 
  UserPlus, 
  Users, 
  Video, 
  MessageSquare, 
  Shield, 
  CheckCircle, 
  XCircle,
  Trash2,
  Check,
  Clock,
  Search
} from 'lucide-react'

interface Notification {
  id: string
  type: 'friend_request' | 'friend_accepted' | 'friend_rejected' | 'room_invitation' | 'video_upload' | 'room_created' | 'payment_success' | 'system_alert'
  title: string
  message: string
  data?: Record<string, string | number | boolean | null>
  isRead: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('all')
  const [filterCategory, setFilterCategory] = useState<'all' | 'friends' | 'rooms' | 'videos' | 'payments' | 'system'>('all')

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
      } else {
        throw new Error('Failed to load notifications')
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (session?.user?.id) {
      loadNotifications()
    }
  }, [session?.user?.id, loadNotifications])

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, action: 'mark-read' })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          )
        )
        toast({
          title: "Success",
          description: "Notification marked as read"
        })
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-all-read' })
      })

      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })))
        toast({
          title: "Success",
          description: "All notifications marked as read"
        })
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
        toast({
          title: "Success",
          description: "Notification deleted"
        })
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return <UserPlus className="h-5 w-5 text-blue-500" />
      case 'friend_accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'friend_rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'room_invitation':
        return <Users className="h-5 w-5 text-purple-500" />
      case 'video_upload':
        return <Video className="h-5 w-5 text-orange-500" />
      case 'room_created':
        return <MessageSquare className="h-5 w-5 text-indigo-500" />
      case 'payment_success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'system_alert':
        return <Shield className="h-5 w-5 text-gray-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'friend_request':
        return 'bg-blue-50 border-blue-200'
      case 'friend_accepted':
        return 'bg-green-50 border-green-200'
      case 'friend_rejected':
        return 'bg-red-50 border-red-200'
      case 'room_invitation':
        return 'bg-purple-50 border-purple-200'
      case 'video_upload':
        return 'bg-orange-50 border-orange-200'
      case 'room_created':
        return 'bg-indigo-50 border-indigo-200'
      case 'payment_success':
        return 'bg-green-50 border-green-200'
      case 'system_alert':
        return 'bg-gray-50 border-gray-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getCategoryFromType = (type: string) => {
    switch (type) {
      case 'friend_request':
      case 'friend_accepted':
      case 'friend_rejected':
        return 'friends'
      case 'room_invitation':
      case 'room_created':
        return 'rooms'
      case 'video_upload':
        return 'videos'
      case 'payment_success':
        return 'payments'
      case 'system_alert':
        return 'system'
      default:
        return 'system'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`
    return date.toLocaleDateString()
  }

  // Filter notifications based on search and filters
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = searchQuery === '' || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesReadFilter = filterType === 'all' || 
      (filterType === 'unread' && !notification.isRead) ||
      (filterType === 'read' && notification.isRead)
    
    const matchesCategoryFilter = filterCategory === 'all' || 
      getCategoryFromType(notification.type) === filterCategory

    return matchesSearch && matchesReadFilter && matchesCategoryFilter
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Bell className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl">Please sign in to view notifications</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Notifications</h1>
          <p className="text-gray-300 text-lg">Stay updated with your TeenZoom activity</p>
        </div>

        {/* Stats and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-white/20 text-white">
              <Bell className="h-4 w-4 mr-1" />
              {notifications.length} Total
            </Badge>
            <Badge variant="destructive" className="bg-red-500/20 text-red-300">
              {unreadCount} Unread
            </Badge>
            <Button onClick={markAllAsRead} disabled={unreadCount === 0} className="bg-blue-600 hover:bg-blue-700">
              <Check className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Read/Unread Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterType('all')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filterType === 'unread' ? 'default' : 'outline'}
              onClick={() => setFilterType('unread')}
              size="sm"
            >
              Unread ({unreadCount})
            </Button>
            <Button
              variant={filterType === 'read' ? 'default' : 'outline'}
              onClick={() => setFilterType('read')}
              size="sm"
            >
              Read
            </Button>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterCategory('all')}
              size="sm"
            >
              All Categories
            </Button>
            <Button
              variant={filterCategory === 'friends' ? 'default' : 'outline'}
              onClick={() => setFilterCategory('friends')}
              size="sm"
            >
              Friends
            </Button>
            <Button
              variant={filterCategory === 'rooms' ? 'default' : 'outline'}
              onClick={() => setFilterCategory('rooms')}
              size="sm"
            >
              Rooms
            </Button>
            <Button
              variant={filterCategory === 'videos' ? 'default' : 'outline'}
              onClick={() => setFilterCategory('videos')}
              size="sm"
            >
              Videos
            </Button>
            <Button
              variant={filterCategory === 'payments' ? 'default' : 'outline'}
              onClick={() => setFilterCategory('payments')}
              size="sm"
            >
              Payments
            </Button>
            <Button
              variant={filterCategory === 'system' ? 'default' : 'outline'}
              onClick={() => setFilterCategory('system')}
              size="sm"
            >
              System
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="text-center py-12">
                <Bell className="h-16 w-16 mx-auto mb-4 text-gray-400 opacity-50" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {searchQuery || filterType !== 'all' || filterCategory !== 'all' 
                    ? 'No notifications found' 
                    : 'No notifications yet'
                  }
                </h3>
                <p className="text-gray-300">
                  {searchQuery || filterType !== 'all' || filterCategory !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'You&apos;ll see notifications here when you have activity on TeenZoom'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`${getNotificationColor(notification.type)} border-2 transition-all hover:shadow-lg ${
                  !notification.isRead ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={`text-lg font-semibold ${
                            notification.isRead ? 'text-gray-700' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h3>
                          <p className={`text-gray-600 mt-1 ${
                            notification.isRead ? 'text-gray-500' : 'text-gray-600'
                          }`}>
                            {notification.message}
                          </p>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(notification.createdAt)}
                        </div>
                        {!notification.isRead && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
