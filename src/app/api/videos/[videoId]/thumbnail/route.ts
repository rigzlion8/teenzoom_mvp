import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateThumbnailForExistingVideo } from '@/lib/cloudinary'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { videoId } = await params
    const { time = 1 } = await request.json()

    // Get the video record
    const video = await prisma.roomVideo.findUnique({
      where: { id: videoId }
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Check if user owns the video or is admin
    if (video.uploadedBy !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized to modify this video' }, { status: 403 })
    }

    // Extract public_id from video URL
    const videoUrl = video.videoUrl
    const publicIdMatch = videoUrl.match(/\/v\d+\/(.+?)(?:\.[^.]+)?$/)
    
    if (!publicIdMatch) {
      return NextResponse.json({ error: 'Invalid video URL format' }, { status: 400 })
    }

    const publicId = publicIdMatch[1]

    // Generate new thumbnail
    const thumbnailUrl = await generateThumbnailForExistingVideo(publicId, time)

    // Update the video record with new thumbnail
    const updatedVideo = await prisma.roomVideo.update({
      where: { id: videoId },
      data: { thumbnailUrl }
    })

    return NextResponse.json({
      message: 'Thumbnail regenerated successfully',
      thumbnailUrl,
      video: updatedVideo
    })
  } catch (error) {
    console.error('Error regenerating thumbnail:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
