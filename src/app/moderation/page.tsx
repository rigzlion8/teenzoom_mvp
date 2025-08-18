"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  AlertTriangle, 
  UserX, 
  MessageSquare, 
  Video, 
  Flag, 
  CheckCircle, 
  XCircle,
  Clock,
  Users,
  Activity
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Report {
  id: string
  type: 'message' | 'video' | 'user' | 'room'
  reason: string
  description: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  reporter: {
    id: string
    username: string
    displayName: string
  }
  reportedContent: {
    id: string
    content: string
    author: {
      id: string
      username: string
      displayName: string
    }
    createdAt: string
  }
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
}

interface ModAction {
  id: string
  type: 'warning' | 'mute' | 'ban' | 'delete'
  target: {
    id: string
    type: 'user' | 'message' | 'video' | 'room'
    content: string
  }
  reason: string
  moderator: string
  duration?: number // in hours, 0 for permanent
  createdAt: string
  expiresAt?: string
  isActive: boolean
}

export default function ModerationPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [reports, setReports] = useState<Report[]>([])
  const [modActions, setModActions] = useState<ModAction[]>([])
  const [selectedTab, setSelectedTab] = useState('reports')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.role === 'admin' || session?.user?.role === 'moderator') {
      fetchModerationData()
    }
  }, [session])

  const fetchModerationData = async () => {
    try {
      const [reportsResponse, actionsResponse] = await Promise.all([
        fetch('/api/moderation/reports'),
        fetch('/api/moderation/actions')
      ])
      
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json()
        setReports(reportsData.reports)
      }
      
      if (actionsResponse.ok) {
        const actionsData = await actionsResponse.json()
        setModActions(actionsData.actions)
      }
    } catch (error) {
      console.error('Error fetching moderation data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReportAction = async (reportId: string, action: 'resolve' | 'dismiss', reason?: string) => {
    try {
      const response = await fetch(`/api/moderation/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason })
      })
      
      if (response.ok) {
        toast({
          title: "Report Updated",
          description: `Report has been ${action === 'resolve' ? 'resolved' : 'dismissed'}`,
        })
        fetchModerationData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update report. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleModAction = async (targetId: string, targetType: string, action: 'warning' | 'mute' | 'ban' | 'delete', reason: string, duration?: number) => {
    try {
      const response = await fetch('/api/moderation/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, targetType, action, reason, duration })
      })
      
      if (response.ok) {
        toast({
          title: "Action Taken",
          description: `Moderation action has been applied successfully`,
        })
        fetchModerationData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply moderation action. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500'
      case 'reviewed': return 'bg-blue-500'
      case 'resolved': return 'bg-green-500'
      case 'dismissed': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'warning': return 'bg-yellow-500'
      case 'mute': return 'bg-orange-500'
      case 'ban': return 'bg-red-500'
      case 'delete': return 'bg-red-600'
      default: return 'bg-gray-500'
    }
  }

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
    return (
      <div className="container mx-auto p-6 text-center">
        <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">You don&apos;t have permission to access moderation tools.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading moderation tools...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Moderation Tools</h1>
        <p className="text-muted-foreground text-center">Manage content and users to maintain a safe community</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{reports.filter(r => r.status === 'pending').length}</p>
                <p className="text-sm text-muted-foreground">Pending Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{modActions.filter(a => a.isActive && a.type === 'warning').length}</p>
                <p className="text-sm text-muted-foreground">Active Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{modActions.filter(a => a.isActive && a.type === 'ban').length}</p>
                <p className="text-sm text-muted-foreground">Banned Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{modActions.length}</p>
                <p className="text-sm text-muted-foreground">Total Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Mod Actions
          </TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Content Reports</CardTitle>
              <CardDescription>Review and manage reported content</CardDescription>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Flag className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No reports to review</p>
                  <p className="text-sm">All clear for now!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card key={report.id} className="border-l-4 border-l-yellow-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(report.status)}>
                              {report.status}
                            </Badge>
                            <Badge variant="outline">{report.type}</Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="mb-3">
                          <p className="font-medium mb-1">Reason: {report.reason}</p>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        </div>
                        
                        <div className="mb-3 p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">Reported Content:</p>
                          <p className="text-sm">{report.reportedContent.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            by @{report.reportedContent.author.username}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Reported by @{report.reporter.username}
                          </div>
                          
                          {report.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleReportAction(report.id, 'resolve')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Resolve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReportAction(report.id, 'dismiss')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Dismiss
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mod Actions Tab */}
        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Moderation Actions</CardTitle>
              <CardDescription>View and manage moderation actions taken</CardDescription>
            </CardHeader>
            <CardContent>
              {modActions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No moderation actions taken</p>
                  <p className="text-sm">All users are following the rules!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modActions.map((action) => (
                    <Card key={action.id} className="border-l-4" style={{ borderLeftColor: getActionColor(action.type) }}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={getActionColor(action.type)}>
                              {action.type.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{action.target.type}</Badge>
                            {action.isActive && (
                              <Badge variant="secondary">Active</Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(action.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="mb-3">
                          <p className="font-medium mb-1">Reason: {action.reason}</p>
                          <p className="text-sm text-muted-foreground">
                            Target: {action.target.content.substring(0, 100)}...
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Moderator: {action.moderator}</span>
                          {action.duration && action.duration > 0 && (
                            <span>Duration: {action.duration}h</span>
                          )}
                          {action.expiresAt && (
                            <span>Expires: {new Date(action.expiresAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common moderation tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold">User Management</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <UserX className="h-4 w-4 mr-1" />
                  Ban User
                </Button>
                <Button variant="outline" size="sm">
                  <Clock className="h-4 w-4 mr-1" />
                  Mute User
                </Button>
                <Button variant="outline" size="sm">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Send Warning
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold">Content Management</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Delete Message
                </Button>
                <Button variant="outline" size="sm">
                  <Video className="h-4 w-4 mr-1" />
                  Remove Video
                </Button>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-1" />
                  Close Room
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
