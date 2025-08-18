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
}

export interface UploadOptions {
  folder?: string
  resource_type?: 'image' | 'video' | 'raw' | 'auto'
  allowed_formats?: string[]
  max_file_size?: number // in bytes
  transformation?: Record<string, unknown>
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
      transformation = {}
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
          public_id: `${folder}/${Date.now()}_${filename.replace(/\.[^/.]+$/, '')}`,
          overwrite: false,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else if (result) {
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              format: result.format,
              resource_type: result.resource_type,
              bytes: result.bytes,
              width: result.width,
              height: result.height,
              duration: result.duration,
            })
          } else {
            reject(new Error('Upload failed'))
          }
        }
      )

      uploadStream.end(file)
    })

    return result
  } catch (error) {
    console.error('Cloudinary upload error:', error)
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
