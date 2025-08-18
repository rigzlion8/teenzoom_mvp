"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Check, CheckCheck, Users, Video, MessageSquare, Gift, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface Notification {
  id: string
  type: 'friend_request' | 'friend_accepted' | 'friend_rejected' | 'room_invitation' | 'video_upload' | 'room_created' | 'payment_success' | 'system_alert'
  title: string
  message: string
  data?: Record<string, string | number | boolean | null>
  isRead: boolean
  createdAt: string
}

export function DashboardNotifications() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications()
    }
  }, [session?.user?.id])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications?limit=5')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.notifications.filter((n: Notification) => !n.isRead).length)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, action: 'mark-read' })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
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
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
        toast({
          title: "All notifications marked as read",
          description: "You're all caught up!",
        })
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
      case 'friend_accepted':
      case 'friend_rejected':
        return <Users className="w-4 h-4" />
      case 'video_upload':
        return <Video className="w-4 h-4" />
      case 'room_invitation':
      case 'room_created':
        return <MessageSquare className="w-4 h-4" />
      case 'payment_success':
        return <Gift className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'friend_request':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'friend_accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'friend_rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'video_upload':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'room_invitation':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'payment_success':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Loading notifications...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="destructive" className="bg-red-500">
                {unreadCount}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
              Mark all read
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/notifications" className="flex items-center gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        <CardDescription>
          Stay updated with your latest activities and notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No notifications yet</p>
            <p className="text-sm">You&apos;re all caught up! New activities will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  notification.isRead 
                    ? 'bg-gray-50 dark:bg-gray-900/50' 
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}
              >
                <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className={`font-medium text-sm ${
                        notification.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                      }`}>
                        {notification.title}
                      </h4>
                      <p className={`text-sm mt-1 ${
                        notification.isRead ? 'text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {notifications.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" size="sm" className="w-full" onClick={() => window.location.href = '/notifications'}>
              View All Notifications
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
