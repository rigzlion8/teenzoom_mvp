import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = await params

    // Get room information
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          select: {
            userId: true,
            role: true,
            joinedAt: true
          }
        },
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check if user has access to this room
    const isMember = room.members.some(member => member.userId === session.user.id)
    const isOwner = room.owner.id === session.user.id
    
    if (room.privacy === 'private' && !isMember && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Transform room data
    const roomData = {
      id: room.id,
      name: room.name,
      description: room.description,
      category: room.category,
      privacy: room.privacy,
      memberCount: room.members.length,
      maxMembers: Number(room.maxUsers),
      isActive: room.isActive,
      tags: room.tags,
      createdAt: room.createdAt,
      lastActivity: room.lastActivity,
      owner: {
        id: room.owner.id,
        username: room.owner.username,
        displayName: room.owner.displayName
      },
      isMember,
      isOwner,
      allowFileSharing: room.allowFileSharing,
      allowVideo: room.allowVideo,
      requireApproval: room.requireApproval
    }

    return NextResponse.json({ room: roomData })
  } catch (error) {
    console.error('Error fetching room:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
