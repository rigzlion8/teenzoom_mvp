import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    // Build where clause for basic filtering
    const where: Prisma.RoomWhereInput = {
      isActive: true
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
        // Note: JSON tag search removed as 'has' is not supported for JSON fields
      ]
    }

    // Get rooms that the user can see based on privacy settings
    const userRooms = await prisma.room.findMany({
      where: {
        OR: [
          { privacy: 'public' },
          { privacy: 'friends_only' },
          { 
            privacy: 'private',
            members: {
              some: {
                userId: session.user.id
              }
            }
          }
        ]
      },
      include: {
        members: {
          select: {
            userId: true,
            role: true
          }
        },
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    })

    // Transform rooms to include member count and user membership status
    const roomsWithStats = userRooms.map(room => {
      const memberCount = room.members.length
      const isMember = room.members.some(member => member.userId === session.user.id)
      
      return {
        id: room.id,
        name: room.name,
        description: room.description,
        category: room.category,
        privacy: room.privacy,
        memberCount,
        maxMembers: room.maxUsers,
        isActive: room.isActive,
        tags: room.tags,
        createdAt: room.createdAt,
        lastActivity: room.lastActivity,
        owner: {
          id: room.owner.id,
          username: room.owner.username,
          displayName: room.owner.displayName
        },
        isMember
      }
    })

    return NextResponse.json({ rooms: roomsWithStats })
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
