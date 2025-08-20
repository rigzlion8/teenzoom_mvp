"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

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
  const [state, setState] = useState<LivestreamState>(initialState)

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

  // Placeholder functions for now
  const startStream = async (privacy: 'public' | 'friends-only', title?: string, description?: string) => {
    console.log('Starting stream with privacy:', privacy, 'title:', title, 'description:', description)
    setIsStreaming(true)
    setIsLive(true)
    setPrivacy(privacy)
    setTitle(title || 'New Stream')
    setDescription(description || 'No description provided')
    setStreamerId('placeholder-streamer-id')
    setStreamerName('Placeholder Streamer')
    setViewerCount(0)
    setConnectionStatus('connected')
    setRemoteUsers([])
    setCurrentStreamId('placeholder-stream-id')
  }

  const stopStream = async () => {
    console.log('Stopping stream')
    setIsStreaming(false)
    setIsLive(false)
    setPrivacy(null)
    setTitle(null)
    setDescription(null)
    setStreamerId(null)
    setStreamerName(null)
    setViewerCount(0)
    setConnectionStatus('idle')
    setRemoteUsers([])
    setCurrentStreamId(null)
  }

  const joinStream = async (streamerId: string) => {
    console.log('Joining stream with streamerId:', streamerId)
    setIsViewing(true)
    setStreamerId(streamerId)
    setStreamerName('Streamer ' + streamerId)
    setViewerCount(0)
    setConnectionStatus('connected')
    setRemoteUsers([])
    setCurrentStreamId('placeholder-stream-id')
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

  const localTracks = { video: null, audio: null }
  const toggleVideo = () => console.log('Toggle video clicked')
  const toggleAudio = () => console.log('Toggle audio clicked')

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
    localTracks, toggleVideo, toggleAudio,
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
