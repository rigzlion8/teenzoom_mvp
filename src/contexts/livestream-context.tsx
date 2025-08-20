"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-react'

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
  remoteUsers: RemoteUserEntry[]
  currentStreamId: string | null
}

interface RemoteUserEntry {
  uid: number
  videoTrack?: unknown
  audioTrack?: unknown
}

interface LivestreamContextType {
  state: LivestreamState
  setState: React.Dispatch<React.SetStateAction<LivestreamState>>
  updateState: (updates: Partial<LivestreamState>) => void
  
  // Individual state getters and setters
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
  remoteUsers: RemoteUserEntry[]
  setRemoteUsers: (value: RemoteUserEntry[]) => void
  currentStreamId: string | null
  setCurrentStreamId: (value: string | null) => void
  
  // Livestream functions
  startStream: (privacy: 'public' | 'friends-only', title?: string, description?: string) => Promise<void>
  stopStream: () => Promise<void>
  joinStream: (streamerId: string) => Promise<void>
  leaveStream: () => Promise<void>
  
  // Additional properties for streamer component
  localTracks: { video: ICameraVideoTrack | null; audio: IMicrophoneAudioTrack | null }
  toggleVideo: () => void
  toggleAudio: () => void
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

  // Individual getters and setters
  const setIsStreaming = (value: boolean) => setState(prev => ({ ...prev, isStreaming: value }))
  const setIsLive = (value: boolean) => setState(prev => ({ ...prev, isLive: value }))
  const setIsViewing = (value: boolean) => setState(prev => ({ ...prev, isViewing: value }))
  const setTitle = (value: string | null) => setState(prev => ({ ...prev, title: value }))
  const setDescription = (value: string | null) => setState(prev => ({ ...prev, description: value }))
  const setPrivacy = (value: 'public' | 'friends-only' | null) => setState(prev => ({ ...prev, privacy: value }))
  const setStreamerId = (value: string | null) => setState(prev => ({ ...prev, streamerId: value }))
  const setStreamerName = (value: string | null) => setState(prev => ({ ...prev, streamerName: value }))
  const setViewerCount = (value: number) => setState(prev => ({ ...prev, viewerCount: value }))
  const setConnectionStatus = (value: 'idle' | 'connecting' | 'connected' | 'failed') => setState(prev => ({ ...prev, connectionStatus: value }))
  const setRemoteUsers = (value: RemoteUserEntry[]) => setState(prev => ({ ...prev, remoteUsers: value }))
  const setCurrentStreamId = (value: string | null) => setState(prev => ({ ...prev, currentStreamId: value }))

  // Livestream functions
  const startStream = async (privacy: 'public' | 'friends-only', title?: string, description?: string) => {
    // Placeholder for actual implementation
    console.log('Starting stream with privacy:', privacy, 'title:', title, 'description:', description);
    setIsStreaming(true);
    setIsLive(true);
    setPrivacy(privacy);
    setTitle(title || 'New Stream');
    setDescription(description || 'No description provided');
    setStreamerId('placeholder-streamer-id'); // Replace with actual streamer ID
    setStreamerName('Placeholder Streamer'); // Replace with actual streamer name
    setViewerCount(0);
    setConnectionStatus('connected');
    setRemoteUsers([]);
    setCurrentStreamId('placeholder-stream-id'); // Replace with actual stream ID
  };

  const stopStream = async () => {
    // Placeholder for actual implementation
    console.log('Stopping stream');
    setIsStreaming(false);
    setIsLive(false);
    setPrivacy(null);
    setTitle(null);
    setDescription(null);
    setStreamerId(null);
    setStreamerName(null);
    setViewerCount(0);
    setConnectionStatus('idle');
    setRemoteUsers([]);
    setCurrentStreamId(null);
  };

  const joinStream = async (streamerId: string) => {
    // Placeholder for actual implementation
    console.log('Joining stream with streamerId:', streamerId);
    setIsViewing(true);
    setStreamerId(streamerId);
    setStreamerName('Streamer ' + streamerId); // Placeholder
    setViewerCount(0); // Placeholder
    setConnectionStatus('connected');
    setRemoteUsers([]); // Placeholder
    setCurrentStreamId('placeholder-stream-id'); // Placeholder
  };

  const leaveStream = async () => {
    // Placeholder for actual implementation
    console.log('Leaving stream');
    setIsViewing(false);
    setStreamerId(null);
    setStreamerName(null);
    setViewerCount(0);
    setConnectionStatus('idle');
    setRemoteUsers([]);
    setCurrentStreamId(null);
  };

  // Additional properties for streamer component
  const localTracks = { video: null, audio: null }; // Placeholder - will be set by actual implementation
  const toggleVideo = () => console.log('Toggle video clicked'); // Placeholder
  const toggleAudio = () => console.log('Toggle audio clicked'); // Placeholder

  const contextValue: LivestreamContextType = {
    state,
    setState,
    updateState,
    // Individual getters and setters
    isStreaming: state.isStreaming,
    setIsStreaming,
    isLive: state.isLive,
    setIsLive,
    isViewing: state.isViewing,
    setIsViewing,
    title: state.title,
    setTitle,
    description: state.description,
    setDescription,
    privacy: state.privacy,
    setPrivacy,
    streamerId: state.streamerId,
    setStreamerId,
    streamerName: state.streamerName,
    setStreamerName,
    viewerCount: state.viewerCount,
    setViewerCount,
    connectionStatus: state.connectionStatus,
    setConnectionStatus,
    remoteUsers: state.remoteUsers,
    setRemoteUsers,
    currentStreamId: state.currentStreamId,
    setCurrentStreamId,
    // Livestream functions
    startStream,
    stopStream,
    joinStream,
    leaveStream,
    // Additional properties for streamer component
    localTracks,
    toggleVideo,
    toggleAudio,
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
