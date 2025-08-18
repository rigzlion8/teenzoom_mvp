import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendFriendResponseNotifications } from '@/lib/notifications'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId } = await params
    const { action } = await request.json()

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Find the friendship request
    const friendship = await prisma.friendship.findUnique({
      where: { id: requestId }
    })

    if (!friendship) {
      return NextResponse.json({ error: 'Friendship request not found' }, { status: 404 })
    }

    // Check if the current user is the one being requested
    if (friendship.friendId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to respond to this request' }, { status: 403 })
    }

    // Update friendship status
    const updatedFriendship = await prisma.friendship.update({
      where: { id: requestId },
      data: {
        status: action === 'accept' ? 'accepted' : 'rejected'
      }
    })

    // Send notifications
    try {
      await sendFriendResponseNotifications(friendship.userId, session.user.id, action === 'accept')
    } catch (notificationError) {
      console.error('Failed to send notifications:', notificationError)
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({
      message: `Friend request ${action}ed successfully`,
      friendship: updatedFriendship
    })
  } catch (error) {
    console.error('Error responding to friend request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
