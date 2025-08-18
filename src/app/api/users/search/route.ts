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
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: 'Search query must be at least 2 characters' }, { status: 400 })
    }

    // Search for users by username or display name
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { displayName: { contains: query, mode: 'insensitive' } }
            ]
          },
          { id: { not: session.user.id } }, // Exclude current user
          { role: { not: 'admin' } } // Exclude admin users (optional filter)
        ]
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        level: true,
        xp: true
      },
      take: 10 // Limit results
    })

    // Check if users are already friends or have pending requests
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const friendship = await prisma.friendship.findFirst({
          where: {
            OR: [
              { userId: session.user.id, friendId: user.id },
              { userId: user.id, friendId: session.user.id }
            ]
          }
        })

        return {
          ...user,
          friendshipStatus: friendship ? friendship.status : 'none'
        }
      })
    )

    // Filter out users who are already friends or have pending requests
    const availableUsers = usersWithStatus.filter(
      user => user.friendshipStatus === 'none'
    )

    return NextResponse.json({ users: availableUsers })
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
