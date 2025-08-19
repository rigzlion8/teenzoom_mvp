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

    // Get pending friend requests sent to the current user
    const requests = await prisma.friendship.findMany({
      where: {
        friendId: session.user.id,
        status: 'pending'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            level: true
          }
        }
      }
    })

    const formattedRequests = requests.map(request => ({
      id: request.id,
      fromUser: {
        id: request.user.id,
        username: request.user.username,
        displayName: request.user.displayName,
        level: Number(request.user.level)
      },
      status: request.status,
      createdAt: request.createdAt
    }))

    return NextResponse.json({ requests: formattedRequests })
  } catch (error) {
    console.error('Error fetching friend requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
