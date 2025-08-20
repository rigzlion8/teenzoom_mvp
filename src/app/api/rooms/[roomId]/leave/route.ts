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

    // Handle special "general" room case
    if (cleanRoomId === 'general') {
      // For general room, find by roomId field instead of id
      const generalRoom = await prisma.room.findFirst({
        where: { roomId: 'general' }
      })

      if (!generalRoom) {
        return NextResponse.json({ error: 'General room not found' }, { status: 404 })
      }

      // Check if user is a member
      const member = await prisma.roomMember.findUnique({
        where: {
          userId_roomId: {
            userId: session.user.id,
            roomId: generalRoom.id
          }
        }
      })

      if (!member) {
        return NextResponse.json({ error: 'Not a member of this room' }, { status: 400 })
      }

      // Remove user from room
      await prisma.roomMember.delete({
        where: {
          userId_roomId: {
            userId: session.user.id,
            roomId: generalRoom.id
          }
        }
      })

      return NextResponse.json({ message: 'Successfully left room' })
    }

    // Check if user is a member for other rooms
    // First try to find by roomId field (for human-readable names)
    let targetRoom = await prisma.room.findFirst({
      where: { roomId: cleanRoomId }
    })

    // If not found by roomId, try to find by MongoDB ObjectID
    if (!targetRoom && /^[0-9a-fA-F]{24}$/.test(cleanRoomId)) {
      targetRoom = await prisma.room.findUnique({
        where: { id: cleanRoomId }
      })
    }

    if (!targetRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const member = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: session.user.id,
          roomId: targetRoom.id
        }
      }
    })

    if (!member) {
      return NextResponse.json({ error: 'Not a member of this room' }, { status: 400 })
    }

    // Remove user from room
    await prisma.roomMember.delete({
      where: {
        userId_roomId: {
          userId: session.user.id,
          roomId: targetRoom.id
        }
      }
    })

    return NextResponse.json({ message: 'Successfully left room' })
  } catch (error) {
    console.error('Error leaving room:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
