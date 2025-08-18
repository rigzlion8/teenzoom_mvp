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

    // Get user's friends
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: session.user.id, status: 'accepted' },
          { friendId: session.user.id, status: 'accepted' }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            lastSeen: true
          }
        },
        friend: {
          select: {
            id: true,
            username: true,
            displayName: true,
            lastSeen: true
          }
        }
      }
    })

    // Transform friendships and get conversation summaries
    const conversations = await Promise.all(
      friendships.map(async (friendship) => {
        const friend = friendship.userId === session.user.id 
          ? friendship.friend 
          : friendship.user

        // Get the last message in this conversation
        const lastMessage = await prisma.directMessage.findFirst({
          where: {
            OR: [
              { senderId: session.user.id, receiverId: friend.id },
              { senderId: friend.id, receiverId: session.user.id }
            ]
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        // Get unread count
        const unreadCount = await prisma.directMessage.count({
          where: {
            senderId: friend.id,
            receiverId: session.user.id,
            isRead: false
          }
        })

        // Calculate online status (online if lastSeen is within 2 minutes)
        const lastSeenTime = friend.lastSeen ? new Date(friend.lastSeen).getTime() : 0
        const timeDiff = Date.now() - lastSeenTime
        const isOnline = lastSeenTime > 0 && timeDiff < 2 * 60 * 1000 // 2 minutes

        return {
          friend: {
            id: friend.id,
            username: friend.username,
            displayName: friend.displayName,
            isOnline,
            lastSeen: friend.lastSeen
          },
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            content: lastMessage.content,
            messageType: lastMessage.messageType,
            createdAt: lastMessage.createdAt,
            senderId: lastMessage.senderId,
            sender: lastMessage.sender
          } : null,
          unreadCount
        }
      })
    )

    // Sort conversations by last message time (most recent first)
    const sortedConversations = conversations
      .filter(conv => conv.lastMessage) // Only show conversations with messages
      .sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0
        if (!a.lastMessage) return 1
        if (!b.lastMessage) return -1
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
      })

    // Add conversations without messages at the end
    const conversationsWithoutMessages = conversations.filter(conv => !conv.lastMessage)
    sortedConversations.push(...conversationsWithoutMessages)

    return NextResponse.json({ conversations: sortedConversations })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
