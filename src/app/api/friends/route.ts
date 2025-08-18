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

    // Get user's friends through Friendship model
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
            level: true,
            xp: true,
            lastSeen: true
          }
        },
        friend: {
          select: {
            id: true,
            username: true,
            displayName: true,
            level: true,
            xp: true,
            lastSeen: true
          }
        }
      }
    })

    // Transform the data to get friend information
    const friends = friendships.map(friendship => {
      const friend = friendship.userId === session.user.id 
        ? friendship.friend 
        : friendship.user
      
      return {
        id: friend.id,
        username: friend.username,
        displayName: friend.displayName,
        isOnline: friend.lastSeen ? 
          (Date.now() - new Date(friend.lastSeen).getTime()) < 5 * 60 * 1000 : false, // 5 minutes
        lastSeen: friend.lastSeen,
        level: friend.level,
        xp: friend.xp
      }
    })

    return NextResponse.json({ friends })
  } catch (error) {
    console.error('Error fetching friends:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
