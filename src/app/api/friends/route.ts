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
      
      // Calculate online status (online if lastSeen is within 2 minutes)
      const lastSeenTime = friend.lastSeen ? new Date(friend.lastSeen).getTime() : 0
      const timeDiff = Date.now() - lastSeenTime
      const isOnline = lastSeenTime > 0 && timeDiff < 2 * 60 * 1000 // 2 minutes
      
      console.log(`Friend ${friend.username}: lastSeen=${friend.lastSeen}, timeDiff=${timeDiff}ms, isOnline=${isOnline}`)
      
      return {
        id: friend.id,
        username: friend.username,
        displayName: friend.displayName,
        isOnline,
        lastSeen: friend.lastSeen,
        level: Number(friend.level),
        xp: Number(friend.xp)
      }
    })

    return NextResponse.json({ friends })
  } catch (error) {
    console.error('Error fetching friends:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
