import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'
import { ChatMessage } from '@/lib/socket-server'

interface UseSocketReturn {
  socket: Socket | null
  isConnected: boolean
  messages: ChatMessage[]
  typingUsers: string[]
  sendMessage: (content: string, roomId: string, messageType?: string) => void
  joinRoom: (roomId: string) => void
  leaveRoom: (roomId: string) => void
  startTyping: (roomId: string) => void
  stopTyping: (roomId: string) => void
}

export const useSocket = (roomId: string): UseSocketReturn => {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const socketRef = useRef<Socket | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize socket connection
  useEffect(() => {
    if (!session?.user) return

    // Initialize Socket.IO server first
    const initSocketServer = async () => {
      try {
        await fetch('/api/socket/io')
      } catch (error) {
        console.error('Failed to initialize Socket.IO server:', error)
      }
    }

    initSocketServer()

    const newSocket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      forceNew: true
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    // Connection events
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id)
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
    })

    // Chat events
    newSocket.on('new_message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message])
    })

    newSocket.on('user_joined', (data: { username: string; displayName: string }) => {
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        content: `${data.displayName} joined the room`,
        userId: 'system',
        username: 'system',
        displayName: 'System',
        roomId,
        messageType: 'text',
        createdAt: new Date()
      }
      setMessages(prev => [...prev, systemMessage])
    })

    newSocket.on('user_left', (data: { username: string; displayName: string }) => {
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        content: `${data.displayName} left the room`,
        userId: 'system',
        username: 'system',
        displayName: 'System',
        roomId,
        messageType: 'text',
        createdAt: new Date()
      }
      setMessages(prev => [...prev, systemMessage])
    })

    newSocket.on('user_typing', (data: { username: string; displayName: string }) => {
      setTypingUsers(prev => {
        if (!prev.includes(data.displayName)) {
          return [...prev, data.displayName]
        }
        return prev
      })
    })

    newSocket.on('user_stopped_typing', (data: { userId: string }) => {
      // Find and remove the typing user
      setTypingUsers(prev => prev.filter(username => username !== data.userId))
    })

    newSocket.on('room_joined', (data: { message: string }) => {
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        content: data.message,
        userId: 'system',
        username: 'system',
        displayName: 'System',
        roomId,
        messageType: 'text',
        createdAt: new Date()
      }
      setMessages(prev => [...prev, systemMessage])
    })

    newSocket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message)
    })

    return () => {
      newSocket.close()
      socketRef.current = null
    }
  }, [session?.user])

  // Join room when socket is connected and roomId changes
  useEffect(() => {
    if (socket && isConnected && session?.user?.id && roomId) {
      socket.emit('join_room', { roomId, userId: session.user.id })
    }
  }, [socket, isConnected, session?.user?.id, roomId])

  // Cleanup on unmount
  useEffect(() => {
    const currentRoomId = roomId
    return () => {
      if (socketRef.current && currentRoomId) {
        socketRef.current.emit('leave_room', { roomId: currentRoomId })
      }
    }
  }, [roomId])

  // Send message function
  const sendMessage = useCallback((content: string, roomId: string, messageType: string = 'text') => {
    if (socket && isConnected) {
      socket.emit('send_message', { content, roomId, messageType })
    }
  }, [socket, isConnected])

  // Join room function
  const joinRoom = useCallback((roomId: string) => {
    if (socket && isConnected && session?.user?.id) {
      socket.emit('join_room', { roomId, userId: session.user.id })
    }
  }, [socket, isConnected, session?.user?.id])

  // Leave room function
  const leaveRoom = useCallback((roomId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_room', { roomId })
    }
  }, [socket, isConnected])

  // Start typing function
  const startTyping = useCallback((roomId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { roomId })
    }
  }, [socket, isConnected])

  // Stop typing function
  const stopTyping = useCallback((roomId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { roomId })
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Set new timeout to stop typing after delay
      typingTimeoutRef.current = setTimeout(() => {
        if (socket && isConnected) {
          socket.emit('typing_stop', { roomId })
        }
      }, 1000)
    }
  }, [socket, isConnected])

  return {
    socket,
    isConnected,
    messages,
    typingUsers,
    sendMessage,
    joinRoom,
    leaveRoom,
    startTyping,
    stopTyping
  }
}
