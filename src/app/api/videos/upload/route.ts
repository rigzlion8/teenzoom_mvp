import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const video = formData.get('video') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string

    if (!video) {
      return NextResponse.json({ error: 'Video file is required' }, { status: 400 })
    }

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Video title is required' }, { status: 400 })
    }

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

    // Create video record in database
    const videoRecord = await prisma.roomVideo.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        videoUrl: uploadResult.secure_url,
        thumbnailUrl: null, // Could generate thumbnail later
        duration: uploadResult.duration || 0,
        roomId: 'general', // Default to general room for now
        uploadedBy: session.user.id
      }
    })

    return NextResponse.json({
      message: 'Video uploaded successfully',
      video: videoRecord
    })
  } catch (error) {
    console.error('Error uploading video:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
