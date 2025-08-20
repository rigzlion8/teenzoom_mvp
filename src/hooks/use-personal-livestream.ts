"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSocket } from '@/hooks/use-socket'
import { useLivestreamContext } from '@/contexts/livestream-context'

export const usePersonalLivestream = () => {
  const { data: session } = useSession()
  const { socket, isConnected } = useSocket('personal-livestream')
  const {
    setIsStreaming, setIsLive, setStreamerId, setStreamerName,
    setTitle, setDescription, setPrivacy, setViewerCount,
    setConnectionStatus, setRemoteUsers, setCurrentStreamId,
  } = useLivestreamContext()

  // Local state for tracks
  const [localTracks, setLocalTracks] = useState<any>({ video: null, audio: null })
  const agoraClientRef = useRef<any>(null)
  const currentStreamIdRef = useRef<string | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Heartbeat for livestream
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

  // Core livestream functions
  const startStream = useCallback(async (privacy: 'public' | 'friends-only', title?: string, description?: string) => {
    if (!session?.user) {
      console.error('No session')
      return
    }

    try {
      setConnectionStatus('connecting')
      
      // Create local tracks
      const AgoraRTC = await import('agora-rtc-sdk-ng')
      const [audioTrack, videoTrack] = await AgoraRTC.default.createMicrophoneAndCameraTracks()
      
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
      setLocalTracks({ video: null, audio: null })
    }
  }, [session?.user, socket, isConnected, setIsStreaming, setIsLive, setStreamerId, setStreamerName, setTitle, setDescription, setPrivacy, setViewerCount, setConnectionStatus, setRemoteUsers, setCurrentStreamId, startHeartbeat])

  const stopStream = useCallback(async () => {
    try {
      stopHeartbeat()
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
  }, [socket, isConnected, setIsStreaming, setIsLive, setStreamerId, setStreamerName, setTitle, setDescription, setPrivacy, setViewerCount, setConnectionStatus, setRemoteUsers, setCurrentStreamId, stopHeartbeat])

  const joinStream = useCallback(async (streamerId: string) => {
    // Placeholder for now
    console.log('Joining stream:', streamerId)
  }, [])

  const leaveStream = useCallback(async () => {
    // Placeholder for now
    console.log('Leaving stream')
  }, [])

  const toggleVideo = useCallback(() => {
    if (localTracks.video) {
      const enabled = localTracks.video.enabled
      localTracks.video.setEnabled(!enabled)
    }
  }, [localTracks])

  const toggleAudio = useCallback(() => {
    if (localTracks.audio) {
      const enabled = localTracks.audio.enabled
      localTracks.audio.setEnabled(!enabled)
    }
  }, [localTracks])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopHeartbeat()
      if (localTracks.video) {
        localTracks.video.close()
      }
      if (localTracks.audio) {
        localTracks.audio.close()
      }
    }
  }, [stopHeartbeat, localTracks])

  return {
    isLive: false,
    isStreaming: false,
    isViewing: false,
    streamerId: null,
    streamerName: null,
    title: null,
    description: null,
    privacy: null,
    viewerCount: 0,
    remoteUsers: [],
    connectionStatus: 'idle',
    currentStreamId: null,
    localTracks,
    startStream, stopStream, joinStream, leaveStream, toggleVideo, toggleAudio
  }
}
