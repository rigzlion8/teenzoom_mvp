import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getIO } from '@/lib/socket-server'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { friendId } = await request.json()

    if (!friendId) {
      return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 })
    }

    // Verify friendship exists
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: session.user.id, friendId: friendId, status: 'accepted' },
          { userId: friendId, friendId: session.user.id, status: 'accepted' }
        ]
      }
    })

    if (!friendship) {
      return NextResponse.json({ error: 'Friendship not found or not accepted' }, { status: 403 })
    }

    // Get the unread messages before marking them as read
    const unreadMessages = await prisma.directMessage.findMany({
      where: {
        senderId: friendId,
        receiverId: session.user.id,
        isRead: false
      },
      select: {
        id: true,
        senderId: true
      }
    })

    // Mark all unread messages from this friend as read
    await prisma.directMessage.updateMany({
      where: {
        senderId: friendId,
        receiverId: session.user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    // Emit Socket.IO event to notify the sender that their messages were read
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg.id)
      
      // Get the socket instance and emit the event
      const socketServer = getIO()
      if (socketServer) {
        socketServer.emit('messages_read', {
          readerId: session.user.id,
          senderId: friendId,
          messageIds
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
