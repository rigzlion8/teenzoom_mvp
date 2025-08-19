import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { sendVideoUploadNotification } from '@/lib/notifications'

// Interface for file-like objects in Node.js environment
interface FileLike {
  name: string
  type: string
  size: number
  arrayBuffer(): Promise<ArrayBuffer>
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const video = formData.get('video') as FileLike
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const privacy = formData.get('privacy') as string || 'public'

    if (!video) {
      return NextResponse.json({ error: 'Video file is required' }, { status: 400 })
    }

    // Validate that video has the properties we need
    if (!video.name || !video.type || !video.size || video.size === 0) {
      return NextResponse.json({ error: 'Invalid video file' }, { status: 400 })
    }

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Video title is required' }, { status: 400 })
    }

    // Validate privacy setting
    if (!['public', 'private', 'friends_only'].includes(privacy)) {
      return NextResponse.json({ error: 'Invalid privacy setting' }, { status: 400 })
    }

    console.log('Processing video upload:', {
      name: video.name,
      type: video.type,
      size: video.size,
      title,
      description,
      privacy
    })

    // Convert File to Buffer
    const arrayBuffer = await video.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload video to Cloudinary
    const uploadResult = await uploadToCloudinary(
      buffer,
      video.name,
      {
        resource_type: 'video',
        folder: 'teenzoom-videos',
        generate_thumbnail: true, // Generate thumbnail
        thumbnail_time: 1 // Take thumbnail at 1 second mark
      }
    )

    console.log('Cloudinary upload successful:', uploadResult)

    // Find a room to associate the video with (use the first available room or create one)
    let room = await prisma.room.findFirst({
      where: { roomId: 'general' },
      select: { id: true, name: true, roomId: true }
    })

    if (!room) {
      room = await prisma.room.findFirst({
        select: { id: true, name: true, roomId: true }
      })

      if (!room) {
        return NextResponse.json({ error: 'No rooms available for video upload' }, { status: 400 })
      }
    }

    console.log('Using room for video:', room.id, room.name)

    // Create video record in database
    const videoRecord = await prisma.roomVideo.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        videoUrl: uploadResult.secure_url,
        thumbnailUrl: uploadResult.thumbnail_url || null,
        duration: Math.round((uploadResult.duration || 0)),
        roomId: room.id,
        uploadedBy: session.user.id,
        privacy: privacy as 'public' | 'private' | 'friends_only',
        isForwarded: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    console.log('Database record created:', videoRecord)

    // Send notifications to room members (do not refetch room to avoid lastActivity null crash)
    try {
      await sendVideoUploadNotification(videoRecord.id, session.user.id, room.id)
    } catch (notificationError) {
      console.error('Failed to send video upload notifications:', notificationError)
    }

    return NextResponse.json({
      message: 'Video uploaded successfully',
      video: videoRecord
    })
  } catch (error) {
    console.error('Error uploading video:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
