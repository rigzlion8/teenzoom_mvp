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

    // Check if user is a member
    const member = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: session.user.id,
          roomId: cleanRoomId
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
          roomId: cleanRoomId
        }
      }
    })

    return NextResponse.json({ message: 'Successfully left room' })
  } catch (error) {
    console.error('Error leaving room:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
