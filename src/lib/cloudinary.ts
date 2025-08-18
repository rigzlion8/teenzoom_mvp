import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
})

export interface UploadResult {
  public_id: string
  secure_url: string
  format: string
  resource_type: string
  bytes: number
  width?: number
  height?: number
  duration?: number
  thumbnail_url?: string // Add thumbnail URL
}

export interface UploadOptions {
  folder?: string
  resource_type?: 'image' | 'video' | 'raw' | 'auto'
  allowed_formats?: string[]
  max_file_size?: number // in bytes
  transformation?: Record<string, unknown>
  generate_thumbnail?: boolean // Add option to generate thumbnail
  thumbnail_time?: number // Time in seconds for thumbnail (default: 1 second)
}

export const uploadToCloudinary = async (
  file: Buffer,
  filename: string,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  try {
    // Safety check for filename
    if (!filename || typeof filename !== 'string') {
      throw new Error('Invalid filename provided')
    }

    const {
      folder = process.env.CLOUDINARY_FOLDER || 'teenzoom',
      resource_type = 'auto',
      allowed_formats = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'pdf', 'doc', 'docx'],
      max_file_size = 50 * 1024 * 1024, // 50MB default
      transformation = {},
      generate_thumbnail = false,
      thumbnail_time = 1
    } = options

    // Check file size
    if (file.length > max_file_size) {
      throw new Error(`File size exceeds maximum allowed size of ${max_file_size / (1024 * 1024)}MB`)
    }

    // Check file format
    const fileExtension = filename.split('.').pop()?.toLowerCase()
    if (!fileExtension || !allowed_formats.includes(fileExtension)) {
      throw new Error(`File format not allowed. Allowed formats: ${allowed_formats.join(', ')}`)
    }

    // Upload to Cloudinary
    const result = await new Promise<UploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type,
          transformation,
          // Do NOT prefix folder again in public_id to avoid duplicate path
          public_id: `${Date.now()}_${filename.replace(/\.[^/.]+$/, '')}`,
          overwrite: false,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else if (result) {
            const r = result as unknown as {
              public_id: string
              secure_url: string
              format: string
              resource_type: string
              bytes: number
              width?: number
              height?: number
              duration?: number
            }
            resolve({
              public_id: r.public_id,
              secure_url: r.secure_url,
              format: r.format,
              resource_type: r.resource_type,
              bytes: r.bytes,
              width: r.width,
              height: r.height,
              duration: r.duration,
            })
          } else {
            reject(new Error('Upload failed'))
          }
        }
      )

      uploadStream.end(file)
    })

    // Generate thumbnail if requested and it's a video
    if (generate_thumbnail && resource_type === 'video') {
      try {
        const thumbnailUrl = await generateVideoThumbnail(result.public_id, thumbnail_time)
        result.thumbnail_url = thumbnailUrl
      } catch (thumbnailError) {
        console.warn('Failed to generate thumbnail:', thumbnailError)
        // Don't fail the upload if thumbnail generation fails
      }
    }

    return result
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw error
  }
}

// Function to generate video thumbnail
export const generateVideoThumbnail = async (
  publicId: string,
  time: number = 1
): Promise<string> => {
  try {
    // Generate thumbnail URL using Cloudinary's transformation
    const thumbnailUrl = cloudinary.url(publicId, {
      transformation: [
        { width: 320, height: 180, crop: 'fill', gravity: 'auto' },
        { start_offset: time, duration: 1, crop: 'scale' }
      ],
      format: 'jpg',
      quality: 'auto',
      resource_type: 'video'
    })

    return thumbnailUrl
  } catch (error) {
    console.error('Error generating thumbnail:', error)
    throw error
  }
}

// Function to generate thumbnail for existing videos
export const generateThumbnailForExistingVideo = async (
  publicId: string,
  time: number = 1
): Promise<string> => {
  try {
    // Use Cloudinary's video transformation to generate thumbnail
    const thumbnailUrl = cloudinary.url(publicId, {
      transformation: [
        { width: 320, height: 180, crop: 'fill', gravity: 'auto' },
        { start_offset: time, duration: 1, crop: 'scale' }
      ],
      format: 'jpg',
      quality: 'auto',
      resource_type: 'video'
    })

    return thumbnailUrl
  } catch (error) {
    console.error('Error generating thumbnail for existing video:', error)
    throw error
  }
}

// Function to get multiple thumbnail options
export const generateMultipleThumbnails = async (
  publicId: string,
  times: number[] = [1, 5, 10, 15]
): Promise<string[]> => {
  try {
    const thumbnails = await Promise.all(
      times.map(time => generateVideoThumbnail(publicId, time))
    )
    return thumbnails
  } catch (error) {
    console.error('Error generating multiple thumbnails:', error)
    throw error
  }
}

export const deleteFromCloudinary = async (public_id: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(public_id)
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    throw error
  }
}

export const getCloudinaryUrl = (public_id: string, transformation?: Record<string, unknown>): string => {
  return cloudinary.url(public_id, { transformation })
}

export default cloudinary
