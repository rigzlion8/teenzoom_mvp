import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()
    const { requestId } = await params

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Find the friend request
    const friendRequest = await prisma.friendship.findFirst({
      where: {
        id: requestId,
        friendId: session.user.id,
        status: 'pending'
      }
    })

    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 })
    }

    if (action === 'accept') {
      // Accept the friend request
      await prisma.friendship.update({
        where: { id: requestId },
        data: { status: 'accepted' }
      })

      return NextResponse.json({ message: 'Friend request accepted' })
    } else {
      // Reject the friend request
      await prisma.friendship.update({
        where: { id: requestId },
        data: { status: 'rejected' }
      })

      return NextResponse.json({ message: 'Friend request rejected' })
    }
  } catch (error) {
    console.error('Error responding to friend request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
