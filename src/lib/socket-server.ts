import { Server as SocketIOServer } from 'socket.io'
import { prisma } from './prisma'

export interface SocketData {
  userId: string
  username: string
  displayName: string
  roomId: string
}

export interface ChatMessage {
  id: string
  content: string
  userId: string
  username: string
  displayName: string
  roomId: string
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file'
  fileUrl?: string
  fileName?: string
  fileSize?: number
  createdAt: Date
}

// Global Socket.IO instance
let io: SocketIOServer | null = null

export const initSocket = (port?: number) => {
  if (io) return io

  // Use a different port for Socket.IO to avoid conflicts
  // If no specific port is provided, use a port offset from the main app
  let serverPort: number
  
  if (port) {
    serverPort = port
  } else {
    // Use main app port + 1, or fallback to 3001
    const mainPort = parseInt(process.env.PORT || '3000', 10)
    serverPort = mainPort + 1
  }

  console.log(`Initializing Socket.IO server on port ${serverPort}`)

  io = new SocketIOServer(serverPort, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    },
    addTrailingSlash: false
  })

  // Store connected users
  const connectedUsers = new Map<string, SocketData>()

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    // Join room
    socket.on('join_room', async (data: { roomId: string; userId: string }) => {
      try {
        const { roomId, userId } = data
        
        // Get user info from database
        const user = await prisma.user.findUnique({
          where: { id: userId }
        })

        if (!user) {
          socket.emit('error', { message: 'User not found' })
          return
        }

        // Join the room
        socket.join(roomId)
        
        // Store user connection info
        connectedUsers.set(socket.id, {
          userId: user.id,
          username: user.username,
          displayName: user.displayName || user.username,
          roomId
        })

        // Update user's online status
        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: true, lastSeen: new Date() }
        })

        // Notify others in the room
        socket.to(roomId).emit('user_joined', {
          userId: user.id,
          username: user.username,
          displayName: user.displayName || user.username,
          timestamp: new Date()
        })

        // Send room info
        socket.emit('room_joined', {
          roomId,
          message: `Welcome to ${roomId}!`
        })

        console.log(`User ${user.displayName || user.username} joined room ${roomId}`)
      } catch (error) {
        console.error('Error joining room:', error)
        socket.emit('error', { message: 'Failed to join room' })
      }
    })

    // Send message
    socket.on('send_message', async (data: { content: string; roomId: string; messageType?: string }) => {
      try {
        const userData = connectedUsers.get(socket.id)
        if (!userData) {
          socket.emit('error', { message: 'User not authenticated' })
          return
        }

        const { content, roomId, messageType = 'text' } = data

        // Save message to database
        const message = await prisma.message.create({
          data: {
            content,
            userId: userData.userId,
            roomId,
            messageType: messageType as 'text' | 'image' | 'video' | 'audio' | 'file',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })

        // Create message object for broadcasting
        const chatMessage: ChatMessage = {
          id: message.id,
          content: message.content,
          userId: message.userId,
          username: userData.username,
          displayName: userData.displayName || userData.username,
          roomId: message.roomId,
          messageType: message.messageType as 'text' | 'image' | 'video' | 'audio' | 'file',
          fileUrl: message.fileUrl || undefined,
          fileName: message.fileName || undefined,
          fileSize: message.fileSize ? Number(message.fileSize) : undefined,
          createdAt: message.createdAt
        }

        // Broadcast message to all users in the room
        io!.to(roomId).emit('new_message', chatMessage)

        console.log(`Message sent in room ${roomId} by ${userData.username}`)
      } catch (error) {
        console.error('Error sending message:', error)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    // Typing indicator
    socket.on('typing_start', (data: { roomId: string }) => {
      const userData = connectedUsers.get(socket.id)
      if (userData) {
        socket.to(data.roomId).emit('user_typing', {
          userId: userData.userId,
          username: userData.username,
          displayName: userData.displayName || userData.username
        })
      }
    })

    socket.on('typing_stop', (data: { roomId: string }) => {
      const userData = connectedUsers.get(socket.id)
      if (userData) {
        socket.to(data.roomId).emit('user_stopped_typing', {
          userId: userData.userId,
          username: userData.username,
          displayName: userData.displayName || userData.username
        })
      }
    })

    // Leave room
    socket.on('leave_room', async (data: { roomId: string }) => {
      try {
        const userData = connectedUsers.get(socket.id)
        if (userData) {
          socket.leave(data.roomId)
          
          // Notify others in the room
          socket.to(data.roomId).emit('user_left', {
            userId: userData.userId,
            username: userData.username,
            displayName: userData.displayName || userData.username,
            timestamp: new Date()
          })

          console.log(`User ${userData.displayName || userData.username} left room ${data.roomId}`)
        }
      } catch (error) {
        console.error('Error leaving room:', error)
      }
    })

    // Disconnect
    socket.on('disconnect', async () => {
      try {
        const userData = connectedUsers.get(socket.id)
        if (userData) {
          // Update user's online status
          await prisma.user.update({
            where: { id: userData.userId },
            data: { isOnline: false, lastSeen: new Date() }
          })

          // Notify others in the room
          socket.to(userData.roomId).emit('user_disconnected', {
            userId: userData.userId,
            username: userData.username,
            displayName: userData.displayName,
            timestamp: new Date()
          })

          // Remove from connected users
          connectedUsers.delete(socket.id)
          
          console.log(`User ${userData.username} disconnected`)
        }
      } catch (error) {
        console.error('Error handling disconnect:', error)
      }
    })
  })

  return io
}

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized')
  }
  return io
}

export type { SocketIOServer }
