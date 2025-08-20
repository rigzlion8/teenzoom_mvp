"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSocket } from './use-socket'

// Type definitions for Agora (no runtime imports)
interface IAgoraRTCClient {
  on: (event: string, callback: (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => void) => void
  off: (event: string, callback: (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => void) => void
  removeAllListeners: () => void
  join: (appId: string, channel: string, token: string, uid: string | number) => Promise<void>
  leave: () => Promise<void>
  publish: (tracks: unknown[]) => Promise<void>
  unpublish: (track: unknown) => Promise<void>
  subscribe: (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => Promise<void>
}

interface IAgoraRTCRemoteUser {
  uid: string | number
  videoTrack?: IRemoteVideoTrack
  audioTrack?: IRemoteAudioTrack
}

interface ICameraVideoTrack {
  enabled: boolean
  setEnabled: (enabled: boolean) => void
  close: () => void
}

interface IMicrophoneAudioTrack {
  enabled: boolean
  setEnabled: (enabled: boolean) => void
  close: () => void
}

interface IRemoteVideoTrack {
  play: (element?: HTMLElement) => void
}

interface IRemoteAudioTrack {
  play: (element?: HTMLElement) => void
}

// Type for the AgoraRTC module
interface AgoraRTCModule {
  createClient: (config: { mode: string; codec: string }) => IAgoraRTCClient
  createMicrophoneAudioTrack: () => Promise<IMicrophoneAudioTrack>
  createCameraVideoTrack: () => Promise<ICameraVideoTrack>
}

export interface PersonalLivestreamState {
  isLive: boolean
  isStreaming: boolean
  isViewing: boolean
  streamerId: string | null
  streamerName: string | null
  title: string | null
  description: string | null
  privacy: 'public' | 'friends-only' | null
  viewerCount: number
  localTracks: {
    video: ICameraVideoTrack | null
    audio: IMicrophoneAudioTrack | null
  }
  remoteUsers: RemoteUserEntry[]
}

export interface UsePersonalLivestreamReturn extends PersonalLivestreamState {
  startStream: (privacy: 'public' | 'friends-only', title?: string, description?: string) => Promise<void>
  stopStream: () => Promise<void>
  joinStream: (streamerId: string) => Promise<void>
  leaveStream: () => Promise<void>
  toggleVideo: () => Promise<void>
  toggleAudio: () => Promise<void>
  setVideoQuality: (quality: 'low' | 'medium' | 'high') => void
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'failed'
}

type RemoteUserEntry = {
  uid: string | number
  videoTrack?: IRemoteVideoTrack
  audioTrack?: IRemoteAudioTrack
}

export const usePersonalLivestream = (): UsePersonalLivestreamReturn => {
  const { data: session } = useSession()
  const { socket, isConnected } = useSocket('personal-livestream')
  
  // Agora client and state
  const [, setAgoraClient] = useState<IAgoraRTCClient | null>(null)
  const [localTracks, setLocalTracks] = useState<{
    video: ICameraVideoTrack | null
    audio: IMicrophoneAudioTrack | null
  }>({ video: null, audio: null })
  
  // Livestream state
  const [isLive, setIsLive] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isViewing, setIsViewing] = useState(false)
  const [streamerId, setStreamerId] = useState<string | null>(null)
  const [streamerName, setStreamerName] = useState<string | null>(null)
  const [title, setTitle] = useState<string | null>(null)
  const [description, setDescription] = useState<string | null>(null)
  const [privacy, setPrivacy] = useState<'public' | 'friends-only' | null>(null)
  const [viewerCount, setViewerCount] = useState(0)
  const [remoteUsers, setRemoteUsers] = useState<RemoteUserEntry[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle')
  
  // Refs
  const agoraClientRef = useRef<IAgoraRTCClient | null>(null)
  const localTracksRef = useRef<{ video: ICameraVideoTrack | null; audio: IMicrophoneAudioTrack | null }>({ video: null, audio: null })
  const currentStreamIdRef = useRef<string | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Event handlers
  const handleUserPublished = useCallback(async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    try {
      await agoraClientRef.current?.subscribe(user, mediaType)
      
      if (mediaType === 'video') {
        setRemoteUsers(prev => {
          const existing = prev.find(u => u.uid === user.uid)
          if (existing) {
            return prev.map(u => u.uid === user.uid ? { ...u, videoTrack: user.videoTrack || undefined } : u)
          }
          return [...prev, { uid: user.uid, videoTrack: user.videoTrack || undefined }]
        })
      }
      
      if (mediaType === 'audio') {
        setRemoteUsers(prev => {
          const existing = prev.find(u => u.uid === user.uid)
          if (existing) {
            return prev.map(u => u.uid === user.uid ? { ...u, audioTrack: user.audioTrack || undefined } : u)
          }
          return [...prev, { uid: user.uid, audioTrack: user.audioTrack || undefined }]
        })
      }
    } catch (error) {
      console.error('Failed to subscribe to user:', error)
    }
  }, [])

  const handleUserUnpublished = useCallback((user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    if (mediaType === 'video') {
      setRemoteUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, videoTrack: undefined } : u))
    }
    if (mediaType === 'audio') {
      setRemoteUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, audioTrack: undefined } : u))
    }
  }, [])

  const handleUserJoined = useCallback((user: IAgoraRTCRemoteUser) => {
    setRemoteUsers(prev => {
      const exists = prev.some(u => u.uid === user.uid)
      return exists ? prev : [...prev, { uid: user.uid }]
    })
  }, [])

  const handleUserLeft = useCallback((user: IAgoraRTCRemoteUser) => {
    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid))
  }, [])

  // Debug state changes
  useEffect(() => {
    console.log('🔍 State changed - isStreaming:', isStreaming, 'isLive:', isLive, 'title:', title, 'connectionStatus:', connectionStatus)
  }, [isStreaming, isLive, title, connectionStatus])

  // Initialize Agora client
  useEffect(() => {
    if (!session?.user || typeof window === 'undefined') return

    const initAgoraClient = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const AgoraRTC = await import('agora-rtc-sdk-ng') as unknown as AgoraRTCModule
        
        const client = AgoraRTC.createClient({
          mode: 'rtc',
          codec: 'vp8',
        })
        
        setAgoraClient(client)
        agoraClientRef.current = client
        
        // Set up event handlers
        client.on('user-published', handleUserPublished)
        client.on('user-unpublished', handleUserUnpublished)
        client.on('user-joined', handleUserJoined)
        client.on('user-left', handleUserLeft)
        
      } catch (error) {
        console.error('Failed to initialize Agora client:', error)
      }
    }

    initAgoraClient()

    return () => {
      if (agoraClientRef.current) {
        agoraClientRef.current.removeAllListeners()
      }
    }
  }, [session?.user]) // Remove the event handler dependencies

  // Socket.IO event handlers
  const handleViewerJoined = useCallback(() => {
    setViewerCount(prev => prev + 1)
  }, [])

  const handleViewerLeft = useCallback(() => {
    setViewerCount(prev => Math.max(0, prev - 1))
  }, [])

  // Core livestream functions
  const startStream = useCallback(async (privacy: 'public' | 'friends-only', title?: string, description?: string) => {
    if (!session?.user || typeof window === 'undefined') {
      console.error('No session user available or not in browser')
      return
    }

    if (!agoraClientRef.current) {
      console.error('Agora client not initialized')
      return
    }

    // Add connection timeout and retry logic
    const connectionTimeout = 15000 // 15 seconds
    const maxRetries = 3
    let retryCount = 0

    try {
      // Dynamic import to avoid SSR issues
      const AgoraRTC = await import('agora-rtc-sdk-ng') as unknown as AgoraRTCModule
      
      // Create local tracks
      const [audioTrack, videoTrack] = await Promise.all([
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack()
      ])

      // Store tracks
      setLocalTracks({ audio: audioTrack, video: videoTrack })
      localTracksRef.current = { audio: audioTrack, video: videoTrack }

      // Create personal livestream record
      console.log('🔄 Creating livestream record...')
      const response = await fetch('/api/livestream/personal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacy, title, description })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Failed to create livestream:', response.status, errorText)
        throw new Error(`Failed to create livestream: ${response.status} ${errorText}`)
      }

      const { livestream } = await response.json()
      console.log('✅ Livestream created successfully:', livestream.id)
      currentStreamIdRef.current = livestream.id

      // Generate deterministic channel name (same for streamer and viewers)
      const channelName = `personal_${session.user.id.replace(/[^a-zA-Z0-9]/g, '')}`
      
      // Generate consistent UID for Agora (hash of MongoDB ObjectID)
      const generateUid = (objectId: string): number => {
        let hash = 0
        for (let i = 0; i < objectId.length; i++) {
          const char = objectId.charCodeAt(i)
          hash = ((hash << 5) - hash) + char
          hash = hash & hash // Convert to 32-bit integer
        }
        return Math.abs(hash)
      }
      
      const agoraUid = generateUid(session.user.id)
      
      // Get token from API
      const tokenResponse = await fetch('/api/livestream/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: channelName,
          role: 'host',
          uid: agoraUid
        })
      })

      if (!tokenResponse.ok) {
        throw new Error('Failed to get token')
      }

      const { token } = await tokenResponse.json()

      // Join channel with retry logic
      const joinChannel = async (): Promise<void> => {
        try {
          await Promise.race([
            agoraClientRef.current!.join(
              process.env.NEXT_PUBLIC_AGORA_APP_ID!,
              channelName,
              token,
              agoraUid
            ),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Connection timeout')), connectionTimeout)
            )
          ])
        } catch (error) {
          console.error(`Join channel attempt ${retryCount + 1} failed:`, error)
          throw error
        }
      }

      // Retry joining the channel
      console.log('🔄 Setting connection status to connecting...')
      setConnectionStatus('connecting')
      while (retryCount < maxRetries) {
        try {
          console.log(`🔄 Attempting to join channel (attempt ${retryCount + 1}/${maxRetries})...`)
          await joinChannel()
          console.log('✅ Successfully joined channel, setting status to connected')
          setConnectionStatus('connected')
          break // Success, exit retry loop
        } catch (error) {
          retryCount++
          if (retryCount >= maxRetries) {
            console.log('❌ All retry attempts failed, setting status to failed')
            setConnectionStatus('failed')
            throw new Error(`Failed to join channel after ${maxRetries} attempts: ${error}`)
          }
          console.log(`🔄 Retrying connection... (${retryCount}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)) // Exponential backoff
        }
      }

      // Publish tracks
      await agoraClientRef.current.publish([audioTrack, videoTrack])

      // Update state
      console.log('🔄 Setting streaming state to true...')
      setIsStreaming(true)
      console.log('🔄 Setting live state to true...')
      setIsLive(true)
      console.log('🔄 Setting streamer ID:', session.user.id)
      setStreamerId(session.user.id)
      console.log('🔄 Setting streamer name:', session.user.displayName || session.user.username || 'Unknown')
      setStreamerName(session.user.displayName || session.user.username || 'Unknown')
      console.log('🔄 Setting title:', livestream.title)
      setTitle(livestream.title)
      console.log('🔄 Setting description:', livestream.description)
      setDescription(livestream.description)
      console.log('🔄 Setting privacy:', livestream.privacy)
      setPrivacy(livestream.privacy)
      console.log('✅ All state updates completed')

      // Start heartbeat to keep stream alive
      const heartbeatInterval = setInterval(async () => {
        try {
          console.log('💓 Sending heartbeat for stream:', livestream.id)
          const heartbeatResponse = await fetch('/api/livestream/personal/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ streamId: livestream.id })
          })
          
          if (!heartbeatResponse.ok) {
            const errorText = await heartbeatResponse.text()
            console.error('❌ Heartbeat failed:', heartbeatResponse.status, errorText)
          } else {
            console.log('✅ Heartbeat successful')
          }
        } catch (error) {
          console.error('❌ Heartbeat failed:', error)
        }
      }, 30000) // Every 30 seconds

      // Store interval reference for cleanup
      heartbeatIntervalRef.current = heartbeatInterval
      setViewerCount(0)

      // Notify others via Socket.IO
      socket?.emit('personal_livestream_started', {
        streamId: livestream.id,
        streamerId: session.user.id,
        streamerName: session.user.displayName || session.user.username || 'Unknown',
        title: livestream.title,
        privacy: livestream.privacy,
        channelName: channelName
      })

    } catch (error) {
      console.error('Failed to start stream:', error)
      throw error
    }
  }, [session?.user, socket])

  const stopStream = useCallback(async () => {
    try {
      // Unpublish tracks
      if (localTracksRef.current.video) {
        agoraClientRef.current?.unpublish(localTracksRef.current.video)
      }
      if (localTracksRef.current.audio) {
        agoraClientRef.current?.unpublish(localTracksRef.current.audio)
      }

      // Leave channel
      await agoraClientRef.current?.leave()

      // Stop and close tracks
      localTracksRef.current.video?.close()
      localTracksRef.current.audio?.close()

      // Update database
      if (currentStreamIdRef.current) {
        await fetch('/api/livestream/personal', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'stop' })
        })
      }

      // Clear heartbeat interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }

      // Reset state
      setLocalTracks({ video: null, audio: null })
      localTracksRef.current = { video: null, audio: null }
      setIsStreaming(false)
      setIsLive(false)
      setStreamerId(null)
      setStreamerName(null)
      setTitle(null)
      setDescription(null)
      setPrivacy(null)
      setViewerCount(0)
      setRemoteUsers([])
      currentStreamIdRef.current = null

      // Notify others via Socket.IO
      socket?.emit('personal_livestream_ended', { streamId: currentStreamIdRef.current })

    } catch (error) {
      console.error('Failed to stop stream:', error)
      throw error
    }
  }, [socket])

  const joinStream = useCallback(async (streamerId: string) => {
    if (!agoraClientRef.current || !session?.user || typeof window === 'undefined') return

    try {
      // Generate deterministic channel name (same format as streamer)
      const actualChannelName = `personal_${streamerId.replace(/[^a-zA-Z0-9]/g, '')}`
      
      // Generate consistent UID for Agora (hash of MongoDB ObjectID)
      const generateUid = (objectId: string): number => {
        let hash = 0
        for (let i = 0; i < objectId.length; i++) {
          const char = objectId.charCodeAt(i)
          hash = ((hash << 5) - hash) + char
          hash = hash & hash // Convert to 32-bit integer
        }
        return Math.abs(hash)
      }
      
      const agoraUid = generateUid(session.user.id)
      
      // Get token from API
      const response = await fetch('/api/livestream/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: actualChannelName,
          role: 'audience',
          uid: agoraUid
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get token')
      }

      const { token } = await response.json()

      // Join channel as audience with retry logic
      const joinChannel = async (): Promise<void> => {
        try {
          await Promise.race([
            agoraClientRef.current!.join(
              process.env.NEXT_PUBLIC_AGORA_APP_ID!,
              actualChannelName,
              token,
              agoraUid
            ),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Connection timeout')), 15000)
            )
          ])
        } catch (error) {
          console.error('Join channel as audience failed:', error)
          throw error
        }
      }

      // Retry joining the channel
      let retryCount = 0
      const maxRetries = 3
      while (retryCount < maxRetries) {
        try {
          await joinChannel()
          break // Success, exit retry loop
        } catch (error) {
          retryCount++
          if (retryCount >= maxRetries) {
            throw new Error(`Failed to join channel after ${maxRetries} attempts: ${error}`)
          }
          console.log(`Retrying connection... (${retryCount}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)) // Exponential backoff
        }
      }

      setIsViewing(true)

      // Notify via Socket.IO
      socket?.emit('personal_viewer_joined', { streamId: streamerId, userId: session.user.id })

    } catch (error) {
      console.error('Failed to join stream:', error)
      throw error
    }
  }, [session?.user, socket])

  const leaveStream = useCallback(async () => {
    try {
      await agoraClientRef.current?.leave()
      setIsViewing(false)
      setRemoteUsers([])

      // Notify via Socket.IO
      socket?.emit('personal_viewer_left', { streamId: streamerId, userId: session?.user?.id })

    } catch (error) {
      console.error('Failed to leave stream:', error)
      throw error
    }
  }, [streamerId, session?.user?.id, socket])

  const toggleVideo = useCallback(async () => {
    if (localTracksRef.current.video) {
      if (localTracksRef.current.video.enabled) {
        localTracksRef.current.video.setEnabled(false)
      } else {
        localTracksRef.current.video.setEnabled(true)
      }
    }
  }, [])

  const toggleAudio = useCallback(async () => {
    if (localTracksRef.current.audio) {
      if (localTracksRef.current.audio.enabled) {
        localTracksRef.current.audio.setEnabled(false)
      } else {
        localTracksRef.current.audio.setEnabled(true)
      }
    }
  }, [])

  const setVideoQuality = useCallback((quality: 'low' | 'medium' | 'high') => {
    // Implementation for quality settings
    console.log('Setting video quality to:', quality)
  }, [])

  // Socket.IO event handlers for personal livestream coordination
  useEffect(() => {
    if (!socket || !isConnected) return

    // Listen for personal livestream events
    socket.on('personal_viewer_joined', handleViewerJoined)
    socket.on('personal_viewer_left', handleViewerLeft)

    return () => {
      socket.off('personal_viewer_joined', handleViewerJoined)
      socket.off('personal_viewer_left', handleViewerLeft)
    }
  }, [socket, isConnected, handleViewerJoined, handleViewerLeft])

  return {
    isLive,
    isStreaming,
    isViewing,
    streamerId,
    streamerName,
    title,
    description,
    privacy,
    viewerCount,
    localTracks,
    remoteUsers,
    connectionStatus,
    startStream,
    stopStream,
    joinStream,
    leaveStream,
    toggleVideo,
    toggleAudio,
    setVideoQuality,
  }
}
