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
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    // Build where clause
    const where: {
      isActive?: boolean
      category?: string
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' }
        description?: { contains: string; mode: 'insensitive' }
        tags?: { has: string }
      }>
    } = {
      isActive: true
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ]
    }

    // Get rooms with member count and check if current user is a member
    const rooms = await prisma.room.findMany({
      where,
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
        { lastActivity: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // Transform rooms to include member count and user membership status
    const roomsWithStats = rooms.map(room => {
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
        owner: room.owner,
        isMember
      }
    })

    return NextResponse.json({ rooms: roomsWithStats })
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
