"use client"

import React, { useState, useRef, useCallback } from 'react'
import { Upload, X, File, Image, Video, Music, FileText } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onUploadError?: (error: string) => void
  maxFileSize?: number // in MB
  allowedTypes?: string[]
  multiple?: boolean
  className?: string
  disabled?: boolean
}

interface FileWithPreview extends File {
  preview?: string
  uploadProgress?: number
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error'
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onUploadError,
  maxFileSize = 50, // 50MB default
  allowedTypes = ['image/*', 'video/*', 'audio/*', 'application/*'],
  multiple = false,
  className,
  disabled = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (file: File) => {
    const type = file.type.split('/')[0]
    switch (type) {
      case 'image':
        return <Image className="w-8 h-8 text-blue-500" />
      case 'video':
        return <Video className="w-8 h-8 text-purple-500" />
      case 'audio':
        return <Music className="w-8 h-8 text-green-500" />
      default:
        return <FileText className="w-8 h-8 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`
    }

    // Check file type
    const isValidType = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1))
      }
      return file.type === type
    })

    if (!isValidType) {
      return 'File type not allowed'
    }

    return null
  }

  const handleFileSelect = useCallback((files: FileList | null) => {
    console.log('handleFileSelect called with:', files)
    if (!files || files.length === 0) {
      console.log('No files provided')
      return
    }

    const newFiles: FileWithPreview[] = []
    const errors: string[] = []

    Array.from(files).forEach((file, index) => {
      console.log(`Processing file ${index}:`, file, 'name:', file?.name, 'type:', file?.type, 'size:', file?.size)
      
      // Safety check to ensure file is valid
      if (!file || !file.name || !file.type) {
        console.error('Invalid file object:', file)
        errors.push('Invalid file selected')
        return
      }

      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
        return
      }

      const fileWithPreview: FileWithPreview = {
        ...file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        uploadStatus: 'pending'
      }
      newFiles.push(fileWithPreview)
    })

    if (errors.length > 0) {
      console.error('File validation errors:', errors)
      onUploadError?.(errors.join('\n'))
    }

    if (newFiles.length > 0) {
      console.log('Valid files to process:', newFiles.length)
      if (multiple) {
        setSelectedFiles(prev => [...prev, ...newFiles])
      } else {
        setSelectedFiles(newFiles)
      }
      
      // Call onFileSelect for each file with the ORIGINAL File object, not FileWithPreview
      Array.from(files).forEach((originalFile, index) => {
        console.log(`Calling onFileSelect for file ${index}:`, originalFile.name)
        if (originalFile && originalFile.name && originalFile.type) {
          onFileSelect(originalFile) // Use the original File object
        } else {
          console.error('Skipping invalid file in onFileSelect:', originalFile)
        }
      })
    }
  }, [maxFileSize, allowedTypes, multiple, onFileSelect, onUploadError, validateFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    console.log('File drop event:', e.dataTransfer.files)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files)
    } else {
      console.log('No files in drop event')
    }
  }, [handleFileSelect])

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Drag & Drop Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
          isDragOver
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          Drop files here or click to browse
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Max file size: {maxFileSize}MB • Supported: Images, Videos, Audio, Documents
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={allowedTypes.join(',')}
        onChange={(e) => {
          console.log('File input onChange triggered:', e.target.files)
          if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files)
          } else {
            console.log('No files selected in file input')
          }
        }}
        className="hidden"
        disabled={disabled}
      />

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Selected Files ({selectedFiles.length})
          </h4>
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
              {file.preview ? (
                <img 
                  src={file.preview} 
                  alt={`Preview of ${file.name}`}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                getFileIcon(file)
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
