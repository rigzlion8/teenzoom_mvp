import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { uploadToCloudinary } from "@/lib/cloudinary"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const roomId = formData.get('roomId') as string

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      )
    }

    if (!roomId) {
      return NextResponse.json(
        { message: "Room ID is required" },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image', 'video', 'audio', 'application']
    const fileType = file.type.split('/')[0]
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { message: "File type not allowed" },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(buffer, file.name, {
      folder: `teenzoom/${roomId}`,
      resource_type: fileType === 'image' ? 'image' : fileType === 'video' ? 'video' : 'raw',
      max_file_size: 50 * 1024 * 1024, // 50MB
    })

    // Return upload result
    return NextResponse.json({
      message: "File uploaded successfully",
      file: {
        id: uploadResult.public_id,
        url: uploadResult.secure_url,
        filename: file.name,
        size: uploadResult.bytes,
        type: file.type,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        duration: uploadResult.duration,
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { message: "Upload failed", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const publicId = searchParams.get('publicId')

    if (!publicId) {
      return NextResponse.json(
        { message: "Public ID is required" },
        { status: 400 }
      )
    }

    // Import delete function
    const { deleteFromCloudinary } = await import('@/lib/cloudinary')
    
    // Delete from Cloudinary
    await deleteFromCloudinary(publicId)

    return NextResponse.json({
      message: "File deleted successfully"
    })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { message: "Delete failed", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
