import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { friendId } = await params

    // Find and delete the friendship
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: session.user.id, friendId: friendId },
          { userId: friendId, friendId: session.user.id }
        ],
        status: 'accepted'
      }
    })

    if (!friendship) {
      return NextResponse.json({ error: 'Friendship not found' }, { status: 404 })
    }

    await prisma.friendship.delete({
      where: { id: friendship.id }
    })

    return NextResponse.json({ message: 'Friend removed successfully' })
  } catch (error) {
    console.error('Error removing friend:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
