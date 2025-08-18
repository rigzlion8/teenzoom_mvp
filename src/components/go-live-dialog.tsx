"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Video, Users, Globe } from 'lucide-react'
import { usePersonalLivestream } from '@/hooks/use-personal-livestream'
import { useToast } from '@/hooks/use-toast'

interface GoLiveDialogProps {
  children: React.ReactNode
}

export function GoLiveDialog({ children }: GoLiveDialogProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [privacy, setPrivacy] = useState<'public' | 'friends-only'>('public')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isStarting, setIsStarting] = useState(false)

  const {
    startStream,
    isStreaming
  } = usePersonalLivestream()

  const handleStartStream = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a stream title",
        variant: "destructive"
      })
      return
    }

    setIsStarting(true)
    try {
      await startStream(privacy, title.trim(), description.trim())
      setIsOpen(false)
      toast({
        title: "Success",
        description: "Your livestream has started!",
      })
    } catch (error) {
      console.error('Failed to start stream:', error)
      toast({
        title: "Error",
        description: "Failed to start livestream. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsStarting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open && isStreaming) {
      toast({
        title: "Warning",
        description: "Cannot close dialog while streaming. Stop your stream first.",
        variant: "destructive"
      })
      return
    }
    setIsOpen(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-green-500" />
            Go Live
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Stream Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Stream Title</Label>
            <Input
              id="title"
              placeholder="Enter your stream title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Stream Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Tell viewers what your stream is about..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Privacy Settings */}
          <div className="space-y-2">
            <Label>Privacy</Label>
            <Select value={privacy} onValueChange={(value: 'public' | 'friends-only') => setPrivacy(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Public - Anyone can join
                  </div>
                </SelectItem>
                <SelectItem value="friends-only">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Friends Only - Only your friends can join
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {privacy === 'public' 
                ? 'Your stream will be visible to all users and can be discovered in the live streams section.'
                : 'Only your friends will be able to see and join your stream.'
              }
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isStarting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartStream}
              disabled={isStarting || !title.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isStarting ? 'Starting...' : 'Start Stream'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
