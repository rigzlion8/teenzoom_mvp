import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log('❌ Heartbeat: No session user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { streamId } = await request.json()
    console.log('🔍 Heartbeat: Received streamId:', streamId, 'for user:', session.user.id)
    
    if (!streamId) {
      console.log('❌ Heartbeat: No stream ID provided')
      return NextResponse.json({ error: 'Stream ID is required' }, { status: 400 })
    }

    // First, let's check if the stream exists
    const existingStream = await prisma.personalLivestream.findUnique({
      where: { id: streamId },
      select: { id: true, streamerId: true, isLive: true, title: true }
    })

    console.log('🔍 Heartbeat: Found stream:', existingStream)

    if (!existingStream) {
      console.log('❌ Heartbeat: Stream not found')
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 })
    }

    if (existingStream.streamerId !== session.user.id) {
      console.log('❌ Heartbeat: User does not own this stream')
      return NextResponse.json({ error: 'Not authorized to update this stream' }, { status: 403 })
    }

    if (!existingStream.isLive) {
      console.log('❌ Heartbeat: Stream is not live')
      return NextResponse.json({ error: 'Stream is not live' }, { status: 400 })
    }

    // Update the stream's updatedAt timestamp to keep it alive
    const updatedStream = await prisma.personalLivestream.update({
      where: {
        id: streamId,
        streamerId: session.user.id,
        isLive: true
      },
      data: {
        updatedAt: new Date()
      }
    })

    console.log('✅ Heartbeat: Successfully updated stream:', updatedStream.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Heartbeat: Error updating stream heartbeat:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
