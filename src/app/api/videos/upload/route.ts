import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToCloudinary } from '@/lib/cloudinary'

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

    console.log('Processing video upload:', {
      name: video.name,
      type: video.type,
      size: video.size,
      title,
      description
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
        folder: 'teenzoom-videos'
      }
    )

    console.log('Cloudinary upload successful:', uploadResult)

    // Find a room to associate the video with (use the first available room or create one)
    let room = await prisma.room.findFirst({
      where: { 
        roomId: 'general',
        // Don't filter by lastActivity since it might be null in existing records
      },
      select: {
        id: true,
        name: true,
        roomId: true
      }
    })

    if (!room) {
      // If no general room exists, use the first available room
      room = await prisma.room.findFirst({
        select: {
          id: true,
          name: true,
          roomId: true
        }
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
        thumbnailUrl: null, // Could generate thumbnail later
        duration: uploadResult.duration || 0,
        roomId: room.id, // Use the actual room ObjectID
        uploadedBy: session.user.id
      }
    })

    console.log('Database record created:', videoRecord)

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
