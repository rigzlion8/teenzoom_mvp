import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      name,
      description,
      category,
      privacy,
      maxMembers,
      allowVideo,
      allowFileSharing,
      requireApproval,
      tags
    } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 })
    }

    // Create the room
    const room = await prisma.room.create({
      data: {
        roomId: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        description: description?.trim() || null,
        category: category || 'general',
        privacy: privacy || 'public',
        maxUsers: maxMembers || 50,
        allowVideo: allowVideo !== undefined ? allowVideo : true,
        allowFileSharing: allowFileSharing !== undefined ? allowFileSharing : true,
        requireApproval: requireApproval || false,
        tags: tags || [],
        ownerId: session.user.id
      }
    })

    // Add the creator as the first member with admin role
    await prisma.roomMember.create({
      data: {
        userId: session.user.id,
        roomId: room.id,
        role: 'admin'
      }
    })

    return NextResponse.json({
      message: 'Room created successfully',
      room: {
        id: room.id,
        name: room.name,
        description: room.description,
        category: room.category,
        privacy: room.privacy,
        maxMembers: room.maxUsers,
        allowVideo: room.allowVideo,
        allowFileSharing: room.allowFileSharing,
        requireApproval: room.requireApproval,
        tags: room.tags,
        createdAt: room.createdAt
      }
    })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
