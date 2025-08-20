import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = await params

    // Clean the roomId - remove "room_" prefix if present
    const cleanRoomId = roomId.startsWith('room_') ? roomId.substring(5) : roomId

    let room: any

    // Handle special "general" room case
    if (cleanRoomId === 'general') {
      let generalRoom = await prisma.room.findFirst({
        where: { roomId: 'general' },
        select: { id: true, name: true, maxUsers: true }
      })

      if (!generalRoom) {
        // Create general room if it doesn't exist
        const adminUser = await prisma.user.findFirst({
          where: { role: 'admin' }
        })

        if (!adminUser) {
          return NextResponse.json({ error: 'No admin user found to create general room' }, { status: 500 })
        }

        generalRoom = await prisma.room.create({
          data: {
            name: 'General Chat',
            description: 'Welcome to the main general chat room!',
            category: 'general',
            privacy: 'public',
            isActive: true,
            allowFileSharing: true,
            allowVideo: true,
            requireApproval: false,
            maxUsers: 1000,
            roomId: 'general',
            ownerId: adminUser.id,
            tags: ['general', 'chat', 'main'],
            createdAt: new Date(),
            updatedAt: new Date(),
            lastActivity: new Date()
          }
        })
      }

      // Use the general room for the rest of the logic
      room = generalRoom
    } else {
      // Check if room exists for other rooms
      room = await prisma.room.findUnique({
        where: { id: cleanRoomId },
        select: { id: true, name: true, maxUsers: true }
      })
    }

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check if user is already a member
    const existingMember = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: session.user.id,
          roomId: cleanRoomId
        }
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: 'Already a member of this room' }, { status: 400 })
    }

    // Check if room is full
    const memberCount = await prisma.roomMember.count({
      where: { roomId: cleanRoomId }
    })

    if (memberCount >= room.maxUsers) {
      return NextResponse.json({ error: 'Room is full' }, { status: 400 })
    }

    // Add user to room
    await prisma.roomMember.create({
      data: {
        userId: session.user.id,
        roomId: cleanRoomId,
        role: 'member',
        isActive: true,
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ message: 'Successfully joined room' })
  } catch (error) {
    console.error('Error joining room:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
