const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
// Use port 3000 as default, Railway will override if needed
const port = process.env.PORT || 3000

// Prepare the Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url, true)
      const { pathname, query } = parsedUrl

      // Let Next.js handle the request
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling request:', err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })

  // Create Socket.IO server attached to the same HTTP server
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    },
    addTrailingSlash: false
  })

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('Socket.IO client connected:', socket.id)
    
    // Join room
    socket.on('join_room', async (data) => {
      try {
        const { roomId, userId, username, displayName } = data
        console.log(`User ${username || userId} joining room ${roomId}`)
        
        // Join the room
        socket.join(roomId)
        
        // Notify others in the room
        socket.to(roomId).emit('user_joined', {
          userId: userId,
          username: username,
          displayName: displayName,
          timestamp: new Date()
        })
        
        console.log(`User ${username || userId} joined room ${roomId}`)
      } catch (error) {
        console.error('Error joining room:', error)
      }
    })

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { content, roomId, messageType } = data
        console.log(`Message in room ${roomId}: ${content}`)
        
        // Broadcast message to room
        io.to(roomId).emit('new_message', {
          id: `msg-${Date.now()}`,
          content,
          roomId,
          messageType: messageType || 'text',
          timestamp: new Date()
        })
      } catch (error) {
        console.error('Error sending message:', error)
      }
    })

    // Typing indicators
    socket.on('typing_start', (data) => {
      const { roomId } = data
      socket.to(roomId).emit('user_typing', { userId: socket.id })
    })

    socket.on('typing_stop', (data) => {
      const { roomId } = data
      socket.to(roomId).emit('user_stopped_typing', { userId: socket.id })
    })

    // Leave room
    socket.on('leave_room', (data) => {
      const { roomId, username, displayName } = data
      socket.leave(roomId)
      socket.to(roomId).emit('user_left', { userId: socket.id, username, displayName })
    })

    // Livestream events
    socket.on('livestream_started', (data) => {
      const { roomId, streamerId, streamerName } = data
      console.log(`Livestream started in room ${roomId} by ${streamerName}`)
      socket.to(roomId).emit('livestream_started', { streamerId, streamerName })
    })

    socket.on('livestream_ended', (data) => {
      const { roomId } = data
      console.log(`Livestream ended in room ${roomId}`)
      socket.to(roomId).emit('livestream_ended')
    })

    socket.on('viewer_joined', (data) => {
      const { roomId, userId } = data
      console.log(`Viewer ${userId} joined livestream in room ${roomId}`)
      socket.to(roomId).emit('viewer_joined')
    })

    socket.on('viewer_left', (data) => {
      const { roomId, userId } = data
      console.log(`Viewer ${userId} left livestream in room ${roomId}`)
      socket.to(roomId).emit('viewer_left')
    })

    // Personal livestream events
    socket.on('personal_livestream_started', (data) => {
      const { streamId, streamerId, streamerName, title, privacy } = data
      console.log(`Personal livestream started by ${streamerName}: ${title}`)
      
      if (privacy === 'public') {
        // Broadcast to all users for public streams
        socket.broadcast.emit('personal_livestream_started', data)
      } else {
        // For friends-only, we'll need to get the user's friends and emit to them
        // This is a simplified version - in production you'd want to get the actual friend list
        socket.broadcast.emit('personal_livestream_started', data)
      }
    })

    socket.on('personal_livestream_ended', (data) => {
      const { streamId } = data
      console.log(`Personal livestream ended: ${streamId}`)
      socket.broadcast.emit('personal_livestream_ended', data)
    })

    socket.on('personal_viewer_joined', (data) => {
      const { streamId, userId } = data
      console.log(`Viewer ${userId} joined personal livestream ${streamId}`)
      socket.broadcast.emit('personal_viewer_joined', data)
    })

    socket.on('personal_viewer_left', (data) => {
      const { streamId, userId } = data
      console.log(`Viewer ${userId} left personal livestream ${streamId}`)
      socket.broadcast.emit('personal_viewer_left', data)
    })
    
    socket.on('disconnect', () => {
      console.log('Socket.IO client disconnected:', socket.id)
    })
  })

  // Start the server
  server
    .once('error', (err) => {
      console.error('Server error:', err)
      process.exit(1)
    })
    .listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> Environment: ${process.env.NODE_ENV}`)
      console.log(`> Port: ${port}`)
      console.log(`> Socket.IO integrated on same port`)
    })
})
