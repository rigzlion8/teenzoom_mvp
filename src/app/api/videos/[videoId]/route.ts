import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { videoId } = await params
    
    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    // Find the video and check ownership
    const video = await prisma.roomVideo.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        uploadedBy: true,
        videoUrl: true,
        thumbnailUrl: true,
        title: true
      }
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Check if the user is the video creator
    if (video.uploadedBy !== session.user.id) {
      return NextResponse.json({ error: 'You can only delete your own videos' }, { status: 403 })
    }

    // TODO: In a production environment, you might want to also delete the files from Cloudinary
    // For now, we'll just remove the database record
    // const cloudinaryDeleteResult = await deleteFromCloudinary(video.videoUrl, video.thumbnailUrl)

    // Delete the video record from database
    await prisma.roomVideo.delete({
      where: { id: videoId }
    })

    console.log(`Video deleted: ${video.title} (ID: ${videoId}) by user: ${session.user.id}`)

    return NextResponse.json({
      message: 'Video deleted successfully',
      deletedVideo: {
        id: video.id,
        title: video.title
      }
    })

  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
