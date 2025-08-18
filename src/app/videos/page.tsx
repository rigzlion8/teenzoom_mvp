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
  Star,
  RefreshCw
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
  const [videoCaption, setVideoCaption] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [lastUploadFile, setLastUploadFile] = useState<File | null>(null)

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

    // Store the file for potential retry
    setLastUploadFile(file)
    setUploadError(null)
    
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
      formData.append('title', videoCaption.trim() || `Video ${Date.now()}`)
      formData.append('description', videoCaption.trim() || 'Uploaded video')
      formData.append('category', selectedCategory)

      console.log('FormData created:', {
        video: file.name,
        title: videoCaption.trim() || `Video ${Date.now()}`,
        description: videoCaption.trim() || 'Uploaded video',
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
          setVideoCaption('') // Reset caption
          setUploadError(null) // Clear any previous errors
          setLastUploadFile(null) // Clear stored file
          fetchVideos()
        }, 500)
      } else {
        const errorData = await response.json().catch(() => 'Unknown error')
        console.log('Video upload error response:', errorData)
        
        let errorMessage = 'Upload failed'
        if (typeof errorData === 'object' && errorData.error) {
          errorMessage = errorData.error
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
        
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Video upload error:', error)
      clearInterval(progressInterval)
      setUploading(false)
      setUploadProgress(0)
      
      // Set error message for retry functionality
      const errorMessage = error instanceof Error ? error.message : 'Upload failed due to network error'
      setUploadError(errorMessage)
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
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

  const regenerateThumbnail = async (videoId: string) => {
    try {
      const response = await fetch(`/api/videos/${videoId}/thumbnail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time: 5 }) // Generate thumbnail at 5 seconds
      })

      if (response.ok) {
        const data = await response.json()
        // Update the video with new thumbnail
        setVideos(prev => prev.map(video => 
          video.id === videoId 
            ? { ...video, thumbnailUrl: data.thumbnailUrl }
            : video
        ))
        toast({
          title: "Thumbnail Updated!",
          description: "Video thumbnail has been regenerated successfully!",
        })
      } else {
        throw new Error('Failed to regenerate thumbnail')
      }
    } catch (error) {
      console.error('Error regenerating thumbnail:', error)
      toast({
        title: "Thumbnail Update Failed",
        description: "Failed to regenerate thumbnail. Please try again.",
        variant: "destructive"
      })
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
                <div className="space-y-2">
                  <label htmlFor="video-caption" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Video Caption (Optional)
                  </label>
                  <div className="relative">
                    <textarea
                      id="video-caption"
                      placeholder="Write a compelling caption for your video... (optional)"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                      rows={3}
                      maxLength={280}
                      value={videoCaption}
                      onChange={(e) => setVideoCaption(e.target.value)}
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                      {videoCaption.length}/280
                    </div>
                  </div>
                </div>
                
                {uploadError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                      <span className="text-sm font-medium">Upload failed:</span>
                      <span className="text-sm">{uploadError}</span>
                    </div>
                    {lastUploadFile && (
                      <Button
                        onClick={() => handleVideoUpload(lastUploadFile)}
                        variant="outline"
                        size="sm"
                        className="mt-2 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry Upload
                      </Button>
                    )}
                  </div>
                )}
                
                <FileUpload
                  onFileSelect={handleVideoUpload}
                  allowedTypes={['video/*']}
                  maxFileSize={100}
                  uploading={uploading}
                  uploadProgress={uploadProgress}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      setShowUpload(false)
                      setVideoCaption('') // Reset caption when closing
                      setUploadError(null) // Clear any errors
                      setLastUploadFile(null) // Clear stored file
                    }} 
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
              <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-white">
                {video.title}
              </h3>
              {video.description && video.description !== video.title && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {video.description}
                </p>
              )}
              
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-medium">
                  {video.author.displayName.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {video.author.displayName}
                </span>
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

              {video.tags && video.tags.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  {video.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

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
                <div className="flex items-center gap-2">
                  {session?.user?.id === video.author.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => regenerateThumbnail(video.id)}
                      className="text-xs"
                      title="Regenerate thumbnail"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
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
