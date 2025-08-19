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

    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, name: true, maxUsers: true }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check if user is already a member
    const existingMember = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: session.user.id,
          roomId: roomId
        }
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: 'Already a member of this room' }, { status: 400 })
    }

    // Check if room is full
    const memberCount = await prisma.roomMember.count({
      where: { roomId: roomId }
    })

    if (memberCount >= room.maxUsers) {
      return NextResponse.json({ error: 'Room is full' }, { status: 400 })
    }

    // Add user to room
    await prisma.roomMember.create({
      data: {
        userId: session.user.id,
        roomId: roomId,
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
