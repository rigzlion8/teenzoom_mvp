"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileUpload } from '@/components/ui/file-upload'
import { VideoPlayer } from '@/components/ui/video-player'
import { 
  Upload, 
  X, 
  Search, 
  Filter, 
  Heart, 
  RefreshCw,
  MessageSquare,
  Users,
  Video
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface VideoItem {
  id: string
  title: string
  description?: string
  videoUrl: string
  thumbnailUrl: string
  duration?: number
  privacy: 'public' | 'private' | 'friends_only'
  createdAt: string
  updatedAt: string
  author: {
    id: string
    username: string
    displayName: string
  }
  isOwner: boolean
}

const videoCategories = [
  { id: 'trending', name: 'Trending', icon: 'TrendingUp', color: 'bg-red-500' },
  { id: 'gaming', name: 'Gaming', icon: 'Play', color: 'bg-purple-500' },
  { id: 'music', name: 'Music', icon: 'Flame', color: 'bg-pink-500' },
  { id: 'comedy', name: 'Comedy', icon: 'Heart', color: 'bg-yellow-500' },
  { id: 'education', name: 'Education', icon: 'Star', color: 'bg-blue-500' },
  { id: 'lifestyle', name: 'Lifestyle', icon: 'Flame', color: 'bg-orange-500' },
]

export default function VideosPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState('trending')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showUpload, setShowUpload] = useState(false)
  const [videoCaption, setVideoCaption] = useState('')
  const [videoPrivacy, setVideoPrivacy] = useState('public')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [lastUploadFile, setLastUploadFile] = useState<File | null>(null)

  const fetchVideos = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/videos?filter=${selectedFilter}`)
      if (response.ok) {
        const data = await response.json()
        setVideos(data.videos)
      } else {
        throw new Error('Failed to fetch videos')
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [selectedFilter, videos.length === 0]) // Only fetch when filter changes or when there are no videos

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
      formData.append('privacy', videoPrivacy)

      console.log('FormData created:', {
        video: file.name,
        title: videoCaption.trim() || `Video ${Date.now()}`,
        description: videoCaption.trim() || 'Uploaded video',
        category: selectedCategory,
        privacy: videoPrivacy
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
          setVideoPrivacy('public') // Reset privacy
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

  const handleLike = (videoId: string) => {
    // TODO: Implement like functionality
    console.log('Like video:', videoId)
  }

  const regenerateThumbnail = async (videoId: string) => {
    try {
      const response = await fetch(`/api/videos/${videoId}/thumbnail`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Thumbnail regenerated successfully!",
        })
        fetchVideos() // Refresh the video list
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to regenerate thumbnail",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error regenerating thumbnail:', error)
      toast({
        title: "Error",
        description: "Failed to regenerate thumbnail",
        variant: "destructive"
      })
    }
  }

  const handleRetryUpload = () => {
    if (lastUploadFile) {
      handleVideoUpload(lastUploadFile)
    }
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
            {/* <CardDescription>
              Upload videos to share with the TeenZoom community
            </CardDescription> */}
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
                  <Label htmlFor="video-caption" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Video Caption (Optional)
                  </Label>
                  <div className="relative">
                    <Textarea
                      id="video-caption"
                      placeholder="Write a compelling caption for your video... (optional)"
                      value={videoCaption}
                      onChange={(e) => setVideoCaption(e.target.value)}
                      className="min-h-[100px] resize-none"
                      maxLength={500}
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                      {videoCaption.length}/500
                    </div>
                  </div>
                </div>

                {/* Privacy Settings */}
                <div className="space-y-2">
                  <Label htmlFor="video-privacy" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Privacy Settings
                  </Label>
                  <Select value={videoPrivacy} onValueChange={setVideoPrivacy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose privacy level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          Public - Anyone can view
                        </div>
                      </SelectItem>
                      <SelectItem value="friends_only">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          Friends Only - Only your friends can view
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          Private - Only you can view
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {videoPrivacy === 'public' && 'Your video will be visible to everyone on TeenZoom'}
                    {videoPrivacy === 'friends_only' && 'Only your accepted friends can see this video'}
                    {videoPrivacy === 'private' && 'This video is only visible to you'}
                  </p>
                </div>
                
                {uploadError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                      <span className="text-sm font-medium">Upload failed:</span>
                      <span className="text-sm">{uploadError}</span>
                    </div>
                    {lastUploadFile && (
                      <Button
                        onClick={handleRetryUpload}
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
                      setVideoPrivacy('public') // Reset privacy when closing
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
              {/* <category.icon className="h-4 w-4" /> */}
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Filter Options */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedFilter('all')}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            All Videos
          </Button>
          <Button
            variant={selectedFilter === 'my-videos' ? 'default' : 'outline'}
            onClick={() => setSelectedFilter('my-videos')}
            className="flex items-center gap-2"
          >
            <Video className="h-4 w-4" />
            My Videos
          </Button>
          <Button
            variant={selectedFilter === 'friends' ? 'default' : 'outline'}
            onClick={() => setSelectedFilter('friends')}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Friends&apos; Videos
          </Button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div key={video.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <VideoPlayer
              videoUrl={video.videoUrl}
              thumbnailUrl={video.thumbnailUrl}
              title={video.title}
              videoId={video.id}
              onForward={() => {
                // Refresh videos after forwarding
                fetchVideos()
              }}
            />
            
            {/* Video Info */}
            <div className="p-4">
              {/* Privacy Badge */}
              <div className="flex items-center justify-between mb-2">
                <Badge 
                  variant={
                    video.privacy === 'public' ? 'default' :
                    video.privacy === 'friends_only' ? 'secondary' :
                    'destructive'
                  }
                  className="text-xs"
                >
                  {video.privacy === 'public' && '🌍 Public'}
                  {video.privacy === 'friends_only' && '👥 Friends Only'}
                  {video.privacy === 'private' && '🔒 Private'}
                </Badge>
                {video.isOwner && (
                  <Badge variant="outline" className="text-xs">
                    👤 Yours
                  </Badge>
                )}
              </div>

              {video.description && video.description !== video.title && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                  {video.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>By {video.author.displayName || video.author.username}</span>
                <span>{video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : 'Unknown'}</span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleLike(video.id)} className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    <span className="ml-1">Like</span>
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="h-4 w-4" />
                    <span className="ml-1">Comment</span>
                  </Button>
                </div>
                
                {video.isOwner && (
                  <Button onClick={() => regenerateThumbnail(video.id)}>
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {/* <Video className="h-16 w-16 mx-auto mb-4 opacity-50" /> */}
          <p className="text-lg">No videos found in this category</p>
          <p className="text-sm">Try selecting a different category or upload the first video!</p>
        </div>
      )}
    </div>
  )
}
