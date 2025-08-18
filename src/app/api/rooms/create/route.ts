import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('Room creation API called')
    
    const session = await getServerSession(authOptions)
    console.log('Session check result:', !!session?.user?.id)
    
    if (!session?.user?.id) {
      console.log('Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Received room creation data:', body)
    
    const {
      name,
      description,
      maxMembers
    } = body

    if (!name || !name.trim()) {
      console.log('Missing room name')
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 })
    }

    console.log('Creating room with data:', {
      name: name.trim(),
      description: description?.trim() || null,
      maxUsers: maxMembers || 50
    })

    // Create the room with current schema fields
    const room = await prisma.room.create({
      data: {
        roomId: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        description: description?.trim() || 'No description',
        maxUsers: maxMembers || 50,
        isPrivate: false,
        ownerId: session.user.id
      }
    })

    console.log('Room created successfully:', room.id)

    // Add the creator as the first member with admin role
    await prisma.roomMember.create({
      data: {
        userId: session.user.id,
        roomId: room.id,
        role: 'admin'
      }
    })

    console.log('Room member added successfully')

    return NextResponse.json({
      message: 'Room created successfully',
      room: {
        id: room.id,
        name: room.name,
        description: room.description,
        maxMembers: room.maxUsers,
        createdAt: room.createdAt
      }
    })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
