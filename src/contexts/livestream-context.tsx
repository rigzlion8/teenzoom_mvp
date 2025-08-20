"use client"

import React, { createContext, useContext, useState, ReactNode, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSocket } from '@/hooks/use-socket'

// Dynamic import for Agora SDK
let AgoraRTC: any = null
if (typeof window !== 'undefined') {
  import('agora-rtc-sdk-ng').then(module => {
    AgoraRTC = module.default
  })
}

// Import token generation functions
import { generateAudienceToken } from '@/lib/agora'

interface LivestreamState {
  isStreaming: boolean
  isLive: boolean
  isViewing: boolean
  title: string | null
  description: string | null
  privacy: 'public' | 'friends-only' | null
  streamerId: string | null
  streamerName: string | null
  viewerCount: number
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'failed'
  remoteUsers: any[]
  currentStreamId: string | null
}

interface LivestreamContextType {
  state: LivestreamState
  setState: React.Dispatch<React.SetStateAction<LivestreamState>>
  updateState: (updates: Partial<LivestreamState>) => void
  isStreaming: boolean
  setIsStreaming: (value: boolean) => void
  isLive: boolean
  setIsLive: (value: boolean) => void
  isViewing: boolean
  setIsViewing: (value: boolean) => void
  title: string | null
  setTitle: (value: string | null) => void
  description: string | null
  setDescription: (value: string | null) => void
  privacy: 'public' | 'friends-only' | null
  setPrivacy: (value: 'public' | 'friends-only' | null) => void
  streamerId: string | null
  setStreamerId: (value: string | null) => void
  streamerName: string | null
  setStreamerName: (value: string | null) => void
  viewerCount: number
  setViewerCount: (value: number) => void
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'failed'
  setConnectionStatus: (value: 'idle' | 'connecting' | 'connected' | 'failed') => void
  remoteUsers: any[]
  setRemoteUsers: (value: any[]) => void
  currentStreamId: string | null
  setCurrentStreamId: (value: string | null) => void
  localTracks: any
  toggleVideo: () => void
  toggleAudio: () => void
  switchCamera: () => Promise<void>
  startStream: (privacy: 'public' | 'friends-only', title?: string, description?: string) => Promise<void>
  stopStream: () => Promise<void>
  joinStream: (streamerId: string) => Promise<void>
  leaveStream: () => Promise<void>
}

const LivestreamContext = createContext<LivestreamContextType | undefined>(undefined)

const initialState: LivestreamState = {
  isStreaming: false,
  isLive: false,
  isViewing: false,
  title: null,
  description: null,
  privacy: null,
  streamerId: null,
  streamerName: null,
  viewerCount: 0,
  connectionStatus: 'idle',
  remoteUsers: [],
  currentStreamId: null
}

export function LivestreamProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const { socket, isConnected } = useSocket('personal-livestream')
  const [state, setState] = useState<LivestreamState>(initialState)
  
  // Local tracks state for camera and mic
  const [localTracks, setLocalTracks] = useState<any>({ video: null, audio: null })
  
  // Refs for Agora client and tracks
  const agoraClientRef = useRef<any>(null)
  const currentStreamIdRef = useRef<string | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const updateState = (updates: Partial<LivestreamState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  // Individual getters and setters (derived from updateState)
  const setIsStreaming = (value: boolean) => updateState({ isStreaming: value })
  const setIsLive = (value: boolean) => updateState({ isLive: value })
  const setIsViewing = (value: boolean) => updateState({ isViewing: value })
  const setTitle = (value: string | null) => updateState({ title: value })
  const setDescription = (value: string | null) => updateState({ description: value })
  const setPrivacy = (value: 'public' | 'friends-only' | null) => updateState({ privacy: value })
  const setStreamerId = (value: string | null) => updateState({ streamerId: value })
  const setStreamerName = (value: string | null) => updateState({ streamerName: value })
  const setViewerCount = (value: number) => updateState({ viewerCount: value })
  const setConnectionStatus = (value: 'idle' | 'connecting' | 'connected' | 'failed') => updateState({ connectionStatus: value })
  const setRemoteUsers = (value: any[]) => updateState({ remoteUsers: value })
  const setCurrentStreamId = (value: string | null) => updateState({ currentStreamId: value })

  // Heartbeat functionality
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
    }
    heartbeatIntervalRef.current = setInterval(() => {
      if (socket && isConnected && currentStreamIdRef.current) {
        socket.emit('heartbeat', { streamId: currentStreamIdRef.current })
      }
    }, 30000)
  }, [socket, isConnected])

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
  }, [])

  // Real implementation with Agora SDK
  const startStream = async (privacy: 'public' | 'friends-only', title?: string, description?: string) => {
    if (!session?.user) {
      console.error('No session')
      return
    }

    try {
      setConnectionStatus('connecting')

      // Create local tracks with Agora SDK
      const AgoraRTC = await import('agora-rtc-sdk-ng')
      const [audioTrack, videoTrack] = await AgoraRTC.default.createMicrophoneAndCameraTracks()
      
      // Set local tracks state
      setLocalTracks({ audio: audioTrack, video: videoTrack })

      // Create livestream on backend
      const response = await fetch('/api/livestream/personal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacy, title, description })
      })

      if (!response.ok) {
        throw new Error('Failed to create livestream')
      }

      const livestream = await response.json()

      // Update context state
      setIsStreaming(true)
      setIsLive(true)
      setStreamerId(session.user.id)
      setStreamerName(session.user.displayName || session.user.username || 'Unknown')
      setTitle(livestream.title)
      setDescription(livestream.description)
      setPrivacy(livestream.privacy)
      setViewerCount(0)
      setConnectionStatus('connected')
      setRemoteUsers([])
      setCurrentStreamId(livestream.id)

      // Start heartbeat
      currentStreamIdRef.current = livestream.id
      startHeartbeat()

      // Notify socket
      if (socket && isConnected) {
        socket.emit('livestream-started', { streamId: livestream.id })
      }

      console.log('Livestream started successfully:', livestream)
    } catch (error) {
      console.error('Failed to start livestream:', error)
      setConnectionStatus('failed')
      
      // Cleanup on failure
      if (localTracks.video) {
        localTracks.video.close()
      }
      if (localTracks.audio) {
        localTracks.audio.close()
      }
      setLocalTracks({ video: null, audio: null })
    }
  }

  const stopStream = async () => {
    try {
      stopHeartbeat()
      
      // Close local tracks
      if (localTracks.video) {
        localTracks.video.close()
      }
      if (localTracks.audio) {
        localTracks.audio.close()
      }
      setLocalTracks({ video: null, audio: null })

      if (currentStreamIdRef.current) {
        await fetch(`/api/livestream/personal/${currentStreamIdRef.current}`, { method: 'DELETE' })
      }

      // Reset context state
      setIsStreaming(false)
      setIsLive(false)
      setStreamerId(null)
      setStreamerName(null)
      setTitle(null)
      setDescription(null)
      setPrivacy(null)
      setViewerCount(0)
      setConnectionStatus('idle')
      setRemoteUsers([])
      setCurrentStreamId(null)

      if (socket && isConnected && currentStreamIdRef.current) {
        socket.emit('livestream-ended', { streamId: currentStreamIdRef.current })
      }

      currentStreamIdRef.current = null
      console.log('Livestream stopped successfully')
    } catch (error) {
      console.error('Failed to stop livestream:', error)
    }
  }

  const joinStream = async (streamerId: string) => {
    try {
      console.log('Joining stream with streamerId:', streamerId)
      setConnectionStatus('connecting')
      
      // Get the stream info from the backend
      const response = await fetch(`/api/livestream/personal?streamerId=${streamerId}`)
      if (!response.ok) {
        throw new Error('Failed to get stream info')
      }
      
      const streamData = await response.json()
      const stream = streamData.livestreams?.find((s: any) => s.streamer.id === streamerId && s.isLive)
      
      if (!stream) {
        throw new Error('Stream not found or not live')
      }
      
      // Set stream info
      setStreamerId(streamerId)
      setStreamerName(stream.streamer.displayName || stream.streamer.username)
      setTitle(stream.title)
      setDescription(stream.description)
      setPrivacy(stream.privacy)
      setViewerCount(stream.viewerCount || 0)
      setCurrentStreamId(stream.id)
      
      // Join Agora channel as viewer
      if (!agoraClientRef.current) {
        agoraClientRef.current = AgoraRTC.default.createClient({ mode: 'live', codec: 'vp8' })
      }
      
      const client = agoraClientRef.current
      
      // Subscribe to streamer's tracks
      client.on('user-published', async (user: any, mediaType: any) => {
        await client.subscribe(user, mediaType)
        
        if (mediaType === 'video') {
          updateState({ 
            remoteUsers: [...state.remoteUsers, { uid: user.uid, videoTrack: user.videoTrack, audioTrack: null }]
          })
        }
        if (mediaType === 'audio') {
          updateState({
            remoteUsers: state.remoteUsers.map((u: any) => 
              u.uid === user.uid ? { ...u, audioTrack: user.audioTrack } : u
            )
          })
        }
      })
      
      client.on('user-unpublished', (user: any) => {
        updateState({
          remoteUsers: state.remoteUsers.filter((u: any) => u.uid !== user.uid)
        })
      })
      
      // Join the channel
      const token = generateAudienceToken(stream.id, session?.user?.id || 'anonymous')
      await client.join(process.env.NEXT_PUBLIC_AGORA_APP_ID!, stream.id, token, streamerId)
      
      setConnectionStatus('connected')
      setIsViewing(true)
      
      console.log('Successfully joined stream as viewer')
      
      // Emit socket event for viewer joined
      if (socket && isConnected) {
        socket.emit('viewer-joined', { streamId: stream.id, viewerId: session?.user?.id })
      }
      
    } catch (error) {
      console.error('Failed to join stream:', error)
      setConnectionStatus('failed')
      setIsViewing(false)
      throw error
    }
  }

  const leaveStream = async () => {
    console.log('Leaving stream')
    setIsViewing(false)
    setStreamerId(null)
    setStreamerName(null)
    setViewerCount(0)
    setConnectionStatus('idle')
    setRemoteUsers([])
    setCurrentStreamId(null)
  }

  // Real toggle functions
  const toggleVideo = useCallback(() => {
    if (localTracks.video) {
      const enabled = localTracks.video.enabled
      localTracks.video.setEnabled(!enabled)
      console.log('Video toggled:', !enabled)
    } else {
      console.log('No video track available')
    }
  }, [localTracks])

  const toggleAudio = useCallback(() => {
    if (localTracks.audio) {
      const enabled = localTracks.audio.enabled
      localTracks.audio.setEnabled(!enabled)
      console.log('Audio toggled:', !enabled)
    } else {
      console.log('No audio track available')
    }
  }, [localTracks])

  const switchCamera = useCallback(async () => {
    try {
      if (!localTracks.video) {
        console.log('No video track available')
        return
      }

      // Get available video devices
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      if (videoDevices.length < 2) {
        alert('Only one camera available on this device')
        return
      }

      // Find current camera and switch to the other one
      const currentDeviceId = localTracks.video.getSettings().deviceId
      const otherDevice = videoDevices.find(device => device.deviceId !== currentDeviceId)
      
      if (!otherDevice) {
        alert('No other camera found')
        return
      }

      // Stop current video track
      localTracks.video.stop()
      
      // Create new video track with the other camera
      const AgoraRTC = await import('agora-rtc-sdk-ng')
      const newVideoTrack = await AgoraRTC.default.createCameraVideoTrack({
        cameraId: otherDevice.deviceId
      })
      
      // Replace the video track
      setLocalTracks((prev: any) => ({ ...prev, video: newVideoTrack }))
      
      // If we have an Agora client and are streaming, publish the new track
      if (agoraClientRef.current && currentStreamIdRef.current) {
        await agoraClientRef.current.publish(newVideoTrack)
      }
      
      console.log('Camera switched successfully')
      
    } catch (error) {
      console.error('Failed to switch camera:', error)
      alert('Failed to switch camera. Please check camera permissions.')
    }
  }, [localTracks.video])

  const contextValue: LivestreamContextType = {
    state, setState, updateState,
    isStreaming: state.isStreaming, setIsStreaming,
    isLive: state.isLive, setIsLive,
    isViewing: state.isViewing, setIsViewing,
    title: state.title, setTitle,
    description: state.description, setDescription,
    privacy: state.privacy, setPrivacy,
    streamerId: state.streamerId, setStreamerId,
    streamerName: state.streamerName, setStreamerName,
    viewerCount: state.viewerCount, setViewerCount,
    connectionStatus: state.connectionStatus, setConnectionStatus,
    remoteUsers: state.remoteUsers, setRemoteUsers,
    currentStreamId: state.currentStreamId, setCurrentStreamId,
    startStream, stopStream, joinStream, leaveStream,
    localTracks, toggleVideo, toggleAudio, switchCamera,
  }

  return (
    <LivestreamContext.Provider value={contextValue}>
      {children}
    </LivestreamContext.Provider>
  )
}

export function useLivestreamContext() {
  const context = useContext(LivestreamContext)
  if (context === undefined) {
    throw new Error('useLivestreamContext must be used within a LivestreamProvider')
  }
  return context
}
