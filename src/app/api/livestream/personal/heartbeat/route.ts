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

    const { streamId } = await request.json()
    
    if (!streamId) {
      return NextResponse.json({ error: 'Stream ID is required' }, { status: 400 })
    }

    // Update the stream's updatedAt timestamp to keep it alive
    await prisma.personalLivestream.update({
      where: {
        id: streamId,
        streamerId: session.user.id, // Ensure user owns the stream
        isLive: true
      },
      data: {
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating stream heartbeat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
