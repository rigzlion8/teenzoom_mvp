import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const friendId = searchParams.get('friendId')

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

    // Get messages between the two users
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: friendId },
          { senderId: friendId, receiverId: session.user.id }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching direct messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { receiverId, content, messageType = 'text', fileUrl, fileName, fileSize, fileType } = await request.json()

    if (!receiverId || !content) {
      return NextResponse.json({ error: 'Receiver ID and content are required' }, { status: 400 })
    }

    // Verify friendship exists
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: session.user.id, friendId: receiverId, status: 'accepted' },
          { userId: receiverId, friendId: session.user.id, status: 'accepted' }
        ]
      }
    })

    if (!friendship) {
      return NextResponse.json({ error: 'Friendship not found or not accepted' }, { status: 403 })
    }

    // Create the message
    const message = await prisma.directMessage.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content,
        messageType: messageType as 'text' | 'image' | 'video' | 'audio' | 'file',
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        fileType: fileType || null
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Error sending direct message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
