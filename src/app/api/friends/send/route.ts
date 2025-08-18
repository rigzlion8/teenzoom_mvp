import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendFriendRequestNotifications } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if users exist
    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.user.id } }),
      prisma.user.findUnique({ where: { id: userId } })
    ])

    if (!sender || !receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: session.user.id, friendId: userId },
          { userId: userId, friendId: session.user.id }
        ]
      }
    })

    if (existingFriendship) {
      return NextResponse.json({ error: 'Friendship already exists' }, { status: 400 })
    }

    // Create friendship request
    const friendship = await prisma.friendship.create({
      data: {
        userId: session.user.id,
        friendId: userId,
        status: 'pending'
      }
    })

    // Send notifications
    try {
      await sendFriendRequestNotifications(session.user.id, userId)
    } catch (notificationError) {
      console.error('Failed to send notifications:', notificationError)
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({
      message: 'Friend request sent successfully',
      friendship
    })
  } catch (error) {
    console.error('Error sending friend request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
