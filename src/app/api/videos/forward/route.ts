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

    const { videoId, targetRoomId } = await request.json()

    if (!videoId || !targetRoomId) {
      return NextResponse.json({ error: 'Video ID and target room ID are required' }, { status: 400 })
    }

    // Check if the video exists
    const video = await prisma.roomVideo.findUnique({
      where: { id: videoId },
      include: { author: { select: { id: true, displayName: true } } }
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Check if the target room exists
    const targetRoom = await prisma.room.findUnique({
      where: { id: targetRoomId },
      select: { id: true, name: true }
    })

    if (!targetRoom) {
      return NextResponse.json({ error: 'Target room not found' }, { status: 404 })
    }

    // Check if the user is a member of the target room
    const roomMembership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: session.user.id,
          roomId: targetRoomId
        }
      }
    })

    if (!roomMembership) {
      return NextResponse.json({ error: 'You must be a member of the target room to forward videos' }, { status: 403 })
    }

    // Create a new video record in the target room
    const forwardedVideo = await prisma.roomVideo.create({
      data: {
        title: `Forwarded: ${video.title}`,
        description: video.description || `Forwarded by ${session.user.displayName || session.user.username}`,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        roomId: targetRoomId,
        uploadedBy: session.user.id,
        isForwarded: true,
        originalVideoId: videoId
      }
    })

    console.log(`Video forwarded: ${video.title} -> ${targetRoom.name}`)

    return NextResponse.json({
      message: 'Video forwarded successfully',
      video: forwardedVideo
    })
  } catch (error) {
    console.error('Error forwarding video:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
