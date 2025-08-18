"use client"

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Users, Lock, Globe, Music, Gamepad2, BookOpen, Heart, Star } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const roomCategories = [
  { id: 'gaming', name: 'Gaming', icon: Gamepad2, color: 'bg-purple-500' },
  { id: 'music', name: 'Music', icon: Music, color: 'bg-pink-500' },
  { id: 'study', name: 'Study', icon: BookOpen, color: 'bg-blue-500' },
  { id: 'social', name: 'Social', icon: Users, color: 'bg-green-500' },
  { id: 'creative', name: 'Creative', icon: Heart, color: 'bg-red-500' },
  { id: 'general', name: 'General', icon: Star, color: 'bg-yellow-500' },
]

const privacyLevels = [
  { id: 'public', name: 'Public', description: 'Anyone can discover and join', icon: Globe, color: 'text-green-600' },
  { id: 'friends_only', name: 'Friends Only', description: 'Only your friends can join', icon: Users, color: 'text-blue-600' },
  { id: 'private', name: 'Private', description: 'Invite only - hidden from discovery', icon: Lock, color: 'text-red-600' },
]

export default function CreateRoomPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    privacy: 'public',
    maxMembers: 50,
    allowVideo: true,
    allowFileSharing: true,
    requireApproval: false,
    tags: [] as string[],
    customTag: ''
  })

  if (!session?.user) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Please sign in to create a room</h1>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted with data:', formData)
    setLoading(true)

    try {
      // Check if we're in production and need to use a different base URL
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? `${window.location.origin}/api/rooms/create`
        : '/api/rooms/create'
      
      console.log('Making API call to:', apiUrl)
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      console.log('API response status:', response.status)
      console.log('API response headers:', response.headers)

      if (response.ok) {
        const data = await response.json()
        console.log('API response data:', data)
        toast({
          title: "Room Created!",
          description: `"${formData.name}" has been created successfully!`,
        })
        router.push(`/room/${data.room.id}`)
      } else {
        const error = await response.json()
        console.log('API error response:', error)
        toast({
          title: "Error",
          description: error.message || "Failed to create room",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Form submission error:', error)
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (formData.customTag.trim() && !formData.tags.includes(formData.customTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.customTag.trim()],
        customTag: ''
      }))
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }))
  }

  const handleMaxMembersChange = (value: string) => {
    setFormData(prev => ({ ...prev, maxMembers: parseInt(value) }))
  }

  const handlePrivacyChange = (value: string) => {
    setFormData(prev => ({ ...prev, privacy: value }))
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Create a New Room</h1>
        <p className="text-muted-foreground text-center">Build your own community space on TeenZoom</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Set the foundation for your room</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Room Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    console.log('Name input changed:', e.target.value)
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }}
                  placeholder="Enter room name..."
                  required
                  maxLength={50}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what your room is about..."
                  rows={3}
                  maxLength={200}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <category.icon className="h-4 w-4" />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Access */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Access</CardTitle>
              <CardDescription>Control who can join your room</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Privacy Level</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  {privacyLevels.map((level) => (
                    <div
                      key={level.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                        formData.privacy === level.id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                      onClick={() => handlePrivacyChange(level.id)}
                    >
                      <div className="flex items-center gap-2">
                        <level.icon className={`h-4 w-4 ${level.color}`} />
                        <div>
                          <p className="font-medium">{level.name}</p>
                          <p className="text-sm text-muted-foreground">{level.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="maxMembers">Maximum Members</Label>
                <Select value={formData.maxMembers.toString()} onValueChange={handleMaxMembersChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 members</SelectItem>
                    <SelectItem value="25">25 members</SelectItem>
                    <SelectItem value="50">50 members</SelectItem>
                    <SelectItem value="100">100 members</SelectItem>
                    <SelectItem value="200">200 members</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="requireApproval">Require Approval to Join</Label>
                  <p className="text-sm text-muted-foreground">Manually approve new members</p>
                </div>
                <Switch
                  id="requireApproval"
                  checked={formData.requireApproval}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requireApproval: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Features & Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Features & Permissions</CardTitle>
              <CardDescription>Enable features for your room members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowVideo">Allow Video Sharing</Label>
                  <p className="text-sm text-muted-foreground">Members can share videos</p>
                </div>
                <Switch
                  id="allowVideo"
                  checked={formData.allowVideo}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowVideo: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowFileSharing">Allow File Sharing</Label>
                  <p className="text-sm text-muted-foreground">Members can share files</p>
                </div>
                <Switch
                  id="allowFileSharing"
                  checked={formData.allowFileSharing}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowFileSharing: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Add tags to help others discover your room</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={formData.customTag}
                  onChange={(e) => setFormData(prev => ({ ...prev, customTag: e.target.value }))}
                  placeholder="Add a tag..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                console.log('Test button clicked')
                console.log('Current form data:', formData)
                console.log('Form validation:', formData.name.trim() ? 'Valid' : 'Invalid')
              }}
            >
              Test Form
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading ? 'Creating Room...' : 'Create Room'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
