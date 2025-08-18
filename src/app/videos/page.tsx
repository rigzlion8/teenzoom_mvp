"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/ui/file-upload'
import { 
  Video, 
  Upload, 
  Heart, 
  MessageCircle, 
  Share2, 
  Play, 
  Clock, 
  Eye,
  TrendingUp,
  Flame,
  Star
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface VideoItem {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  videoUrl: string
  duration: number
  views: number
  likes: number
  comments: number
  author: {
    id: string
    username: string
    displayName: string
    avatar?: string
  }
  tags: string[]
  category: string
  createdAt: string
  isLiked?: boolean
}

const videoCategories = [
  { id: 'trending', name: 'Trending', icon: TrendingUp, color: 'bg-red-500' },
  { id: 'gaming', name: 'Gaming', icon: Play, color: 'bg-purple-500' },
  { id: 'music', name: 'Music', icon: Flame, color: 'bg-pink-500' },
  { id: 'comedy', name: 'Comedy', icon: Heart, color: 'bg-yellow-500' },
  { id: 'education', name: 'Education', icon: Star, color: 'bg-blue-500' },
  { id: 'lifestyle', name: 'Lifestyle', icon: Flame, color: 'bg-orange-500' },
]

export default function VideosPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('trending')
  const [searchQuery, setSearchQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showUpload, setShowUpload] = useState(false)

  const fetchVideos = useCallback(async () => {
    try {
      const response = await fetch(`/api/videos?category=${selectedCategory}`)
      if (response.ok) {
        const data = await response.json()
        setVideos(data.videos)
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
    }
  }, [selectedCategory])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  const handleVideoUpload = async (file: File) => {
    console.log('handleVideoUpload called with file:', file)
    console.log('File details:', {
      name: file?.name,
      type: file?.type,
      size: file?.size,
      isFile: file instanceof File
    })
    
    if (!file) {
      console.error('No file provided to handleVideoUpload')
      return
    }
    
    if (!(file instanceof File)) {
      console.error('handleVideoUpload received non-File object:', typeof file, file)
      return
    }
    
    console.log('Video upload started with file:', file.name, file.size)
    setUploading(true)
    setUploadProgress(0)
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 200)
    
    try {
      const formData = new FormData()
      formData.append('video', file)
      formData.append('title', `Video ${Date.now()}`)
      formData.append('description', 'Uploaded video')
      formData.append('category', selectedCategory)

      console.log('FormData created:', {
        video: file.name,
        title: `Video ${Date.now()}`,
        description: 'Uploaded video',
        category: selectedCategory
      })

      // Check if we're in production and need to use a different base URL
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? `${window.location.origin}/api/videos/upload`
        : '/api/videos/upload'
      
      console.log('Making API call to:', apiUrl)
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData
      })

      console.log('Video upload response status:', response.status)
      console.log('Video upload response headers:', response.headers)

      if (response.ok) {
        const data = await response.json()
        console.log('Video upload success data:', data)
        
        // Complete the progress
        setUploadProgress(100)
        
        // Wait a moment to show 100% completion
        setTimeout(() => {
          toast({
            title: "Video Uploaded!",
            description: "Your video has been uploaded successfully!",
          })
          setShowUpload(false)
          setUploading(false)
          setUploadProgress(0)
          fetchVideos()
        }, 500)
      } else {
        const errorData = await response.json().catch(() => 'Unknown error')
        console.log('Video upload error response:', errorData)
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Video upload error:', error)
      clearInterval(progressInterval)
      setUploading(false)
      setUploadProgress(0)
      toast({
        title: "Upload Failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleLike = async (videoId: string) => {
    try {
      const response = await fetch(`/api/videos/${videoId}/like`, {
        method: 'POST'
      })
      
      if (response.ok) {
        setVideos(prev => prev.map(video => 
          video.id === videoId 
            ? { ...video, isLiked: !video.isLiked, likes: video.isLiked ? video.likes - 1 : video.likes + 1 }
            : video
        ))
      }
    } catch (error) {
      console.error('Error liking video:', error)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
    return views.toString()
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

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Videos</h1>
        <p className="text-muted-foreground text-center">Share and discover amazing content on TeenZoom</p>
      </div>

      {/* Upload Section */}
      {session?.user && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Share Your Video
            </CardTitle>
            <CardDescription>
              Upload videos to share with the TeenZoom community
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showUpload ? (
              <Button onClick={() => setShowUpload(true)} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Upload Video
              </Button>
            ) : (
              <div className="space-y-4">
                <FileUpload
                  onFileSelect={handleVideoUpload}
                  allowedTypes={['video/*']}
                  maxFileSize={100}
                  uploading={uploading}
                  uploadProgress={uploadProgress}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowUpload(false)} 
                    variant="outline"
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search and Categories */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button onClick={() => fetchVideos()}>Search</Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {videoCategories.map((category) => (
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

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((video) => (
          <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <img
                src={video.thumbnailUrl || '/placeholder-video.jpg'}
                alt={video.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
                <Button size="sm" variant="secondary" className="opacity-0 hover:opacity-100 transition-opacity">
                  <Play className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {formatDuration(video.duration)}
              </div>
            </div>
            
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{video.title}</h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{video.description}</p>
              
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-medium">
                  {video.author.displayName.charAt(0)}
                </div>
                <span className="text-sm font-medium">{video.author.displayName}</span>
                <span className="text-xs text-muted-foreground">@{video.author.username}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {formatViews(video.views)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(video.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                {video.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(video.id)}
                    className={`flex items-center gap-1 ${video.isLiked ? 'text-red-500' : ''}`}
                  >
                    <Heart className={`h-4 w-4 ${video.isLiked ? 'fill-current' : ''}`} />
                    {video.likes}
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {video.comments}
                  </Button>
                </div>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No videos found in this category</p>
          <p className="text-sm">Try selecting a different category or upload the first video!</p>
        </div>
      )}
    </div>
  )
}
