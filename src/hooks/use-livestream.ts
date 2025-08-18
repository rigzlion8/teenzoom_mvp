import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSocket } from './use-socket'
import AgoraRTC, { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack
} from 'agora-rtc-sdk-ng'

export interface LivestreamState {
  isLive: boolean
  isStreaming: boolean
  isViewing: boolean
  streamerId: string | null
  streamerName: string | null
  viewerCount: number
  localTracks: {
    video: ICameraVideoTrack | null
    audio: IMicrophoneAudioTrack | null
  }
  remoteUsers: IAgoraRTCRemoteUser[]
}

export interface UseLivestreamReturn extends LivestreamState {
  startStream: () => Promise<void>
  stopStream: () => Promise<void>
  joinStream: () => Promise<void>
  leaveStream: () => Promise<void>
  toggleVideo: () => Promise<void>
  toggleAudio: () => Promise<void>
  setVideoQuality: (quality: 'low' | 'medium' | 'high') => void
}

export const useLivestream = (roomId: string): UseLivestreamReturn => {
  const { data: session } = useSession()
  const { socket, isConnected } = useSocket(roomId)
  
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
  const [viewerCount, setViewerCount] = useState(0)
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([])
  
  // Refs
  const agoraClientRef = useRef<IAgoraRTCClient | null>(null)
  const localTracksRef = useRef<{ video: ICameraVideoTrack | null; audio: IMicrophoneAudioTrack | null }>({ video: null, audio: null })

  // Event handlers
  const handleUserPublished = useCallback(async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    try {
      await agoraClientRef.current?.subscribe(user, mediaType)
      
      if (mediaType === 'video') {
        setRemoteUsers(prev => {
          const existing = prev.find(u => u.uid === user.uid)
          if (existing) {
            existing.videoTrack = user.videoTrack
            return [...prev]
          }
          return [...prev, user]
        })
      }
      
      if (mediaType === 'audio') {
        setRemoteUsers(prev => {
          const existing = prev.find(u => u.uid === user.uid)
          if (existing) {
            existing.audioTrack = user.audioTrack
            return [...prev]
          }
          return [...prev, user]
        })
      }
    } catch (error) {
      console.error('Failed to subscribe to user:', error)
    }
  }, [])

  const handleUserUnpublished = useCallback((user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    if (mediaType === 'video') {
      setRemoteUsers(prev => prev.map(u => 
        u.uid === user.uid ? { ...u, videoTrack: undefined } : u
      ))
    }
    if (mediaType === 'audio') {
      setRemoteUsers(prev => prev.map(u => 
        u.uid === user.uid ? { ...u, audioTrack: undefined } : u
      ))
    }
  }, [])

  const handleUserJoined = useCallback((user: IAgoraRTCRemoteUser) => {
    setRemoteUsers(prev => [...prev, user])
  }, [])

  const handleUserLeft = useCallback((user: IAgoraRTCRemoteUser) => {
    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid))
  }, [])

  // Initialize Agora client
  useEffect(() => {
    if (!session?.user) return

    const initAgoraClient = async () => {
      try {
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
  }, [session?.user, handleUserPublished, handleUserUnpublished, handleUserJoined, handleUserLeft])

  // Socket.IO event handlers
  const handleLivestreamStarted = useCallback((data: { streamerId: string; streamerName: string }) => {
    setIsLive(true)
    setStreamerId(data.streamerId)
    setStreamerName(data.streamerName)
    setViewerCount(1) // Streamer is the first viewer
  }, [])

  const handleLivestreamEnded = useCallback(() => {
    setIsLive(false)
    setStreamerId(null)
    setStreamerName(null)
    setViewerCount(0)
    setRemoteUsers([])
  }, [])

  const handleViewerJoined = useCallback(() => {
    setViewerCount(prev => prev + 1)
  }, [])

  const handleViewerLeft = useCallback(() => {
    setViewerCount(prev => Math.max(0, prev - 1))
  }, [])

  // Core livestream functions
  const startStream = useCallback(async () => {
    if (!session?.user) {
      console.error('No session user available')
      return
    }

    if (!agoraClientRef.current) {
      console.error('Agora client not initialized')
      return
    }

    console.log('Starting stream with session user:', {
      id: session.user.id,
      username: session.user.username,
      displayName: session.user.displayName,
      name: (session.user as { name?: string }).name,
      email: session.user.email
    })

    try {
      // Create local tracks
      const [audioTrack, videoTrack] = await Promise.all([
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack()
      ])

      // Store tracks
      setLocalTracks({ audio: audioTrack, video: videoTrack })
      localTracksRef.current = { audio: audioTrack, video: videoTrack }

      // Get token from API
      const response = await fetch('/api/livestream/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: roomId,
          role: 'host',
          uid: session.user.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get token')
      }

      const { token } = await response.json()

      // Join channel
      await agoraClientRef.current.join(
        process.env.NEXT_PUBLIC_AGORA_APP_ID!,
        roomId,
        token,
        session.user.id
      )

      // Publish tracks
      await agoraClientRef.current.publish([audioTrack, videoTrack])

      // Update state
      setIsStreaming(true)
      setIsLive(true)
      setStreamerId(session.user.id)
      const finalStreamerName = session.user.displayName || session.user.username || 'Unknown'
      setStreamerName(finalStreamerName)
      
      console.log('Stream started with streamerName:', finalStreamerName)

      // Notify others via Socket.IO
      socket?.emit('livestream_started', {
        roomId,
        streamerId: session.user.id,
        streamerName: finalStreamerName
      })

    } catch (error) {
      console.error('Failed to start stream:', error)
      throw error
    }
  }, [roomId, session?.user, socket])

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

      // Reset state
      setLocalTracks({ video: null, audio: null })
      localTracksRef.current = { video: null, audio: null }
      setIsStreaming(false)
      setIsLive(false)
      setStreamerId(null)
      setStreamerName(null)

      // Notify others via Socket.IO
      socket?.emit('livestream_ended', { roomId })

    } catch (error) {
      console.error('Failed to stop stream:', error)
      throw error
    }
  }, [roomId, socket])

  const joinStream = useCallback(async () => {
    if (!agoraClientRef.current || !session?.user || !isLive) return

    try {
      // Get token from API
      const response = await fetch('/api/livestream/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: roomId,
          role: 'audience',
          uid: session.user.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get token')
      }

      const { token } = await response.json()

      // Join channel as audience
      await agoraClientRef.current.join(
        process.env.NEXT_PUBLIC_AGORA_APP_ID!,
        roomId,
        token,
        session.user.id
      )

      setIsViewing(true)

      // Notify via Socket.IO
      socket?.emit('viewer_joined', { roomId, userId: session.user.id })

    } catch (error) {
      console.error('Failed to join stream:', error)
      throw error
    }
  }, [roomId, session?.user, socket, isLive])

  const leaveStream = useCallback(async () => {
    try {
      await agoraClientRef.current?.leave()
      setIsViewing(false)

      // Notify via Socket.IO
      socket?.emit('viewer_left', { roomId, userId: session?.user?.id })

    } catch (error) {
      console.error('Failed to leave stream:', error)
      throw error
    }
  }, [roomId, session?.user?.id, socket])

  // Socket.IO event handlers for livestream coordination
  useEffect(() => {
    if (!socket || !isConnected) return

    // Listen for livestream events
    socket.on('livestream_started', handleLivestreamStarted)
    socket.on('livestream_ended', handleLivestreamEnded)
    socket.on('viewer_joined', handleViewerJoined)
    socket.on('viewer_left', handleViewerLeft)

    return () => {
      socket.off('livestream_started', handleLivestreamStarted)
      socket.off('livestream_ended', handleLivestreamEnded)
      socket.off('viewer_joined', handleViewerJoined)
      socket.off('viewer_left', handleViewerLeft)
    }
  }, [socket, isConnected, handleLivestreamStarted, handleLivestreamEnded, handleViewerJoined, handleViewerLeft])

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

  return {
    isLive,
    isStreaming,
    isViewing,
    streamerId,
    streamerName,
    viewerCount,
    localTracks,
    remoteUsers,
    startStream,
    stopStream,
    joinStream,
    leaveStream,
    toggleVideo,
    toggleAudio,
    setVideoQuality,
  }
}
