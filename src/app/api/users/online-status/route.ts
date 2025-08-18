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

    const body = await request.json()
    const { isOnline } = body

    // Update user's lastSeen timestamp
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        lastSeen: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating online status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's current online status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        lastSeen: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate online status (online if lastSeen is within 2 minutes)
    const isOnline = user.lastSeen ? 
      (Date.now() - new Date(user.lastSeen).getTime()) < 2 * 60 * 1000 : false

    return NextResponse.json({ isOnline, lastSeen: user.lastSeen })
  } catch (error) {
    console.error('Error getting online status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
