import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface MediaUploaderProps {
  storeId?: string
  itemId?: string
  onUploadComplete?: (media: any[]) => void
  onError?: (error: string) => void
  maxFiles?: number
  disabled?: boolean
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  storeId,
  itemId,
  onUploadComplete,
  onError,
  maxFiles = 10,
  disabled = false,
}) => {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!storeId && !itemId) {
      onError?.('Store ID or Item ID is required')
      return
    }

    if (acceptedFiles.length === 0) return

    try {
      const uploadPromises = acceptedFiles.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('storeId', storeId || '')
        formData.append('itemId', itemId || '')

        const response = await fetch('/media/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }

        return response.json()
      })

      const results = await Promise.all(uploadPromises)
      onUploadComplete?.(results)
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Upload failed')
    }
  }, [storeId, itemId, onUploadComplete, onError])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'video/*': ['.mp4', '.webm'],
    },
    maxFiles,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled,
  })

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      <div className="space-y-2">
        <div className="text-lg font-medium">
          {isDragActive ? 'Drop files here' : 'Drag & drop images or videos'}
        </div>
        <div className="text-sm text-gray-500">
          or click to select files
        </div>
        <div className="text-xs text-gray-400">
          Max {maxFiles} files • Images up to 10MB • Videos up to 50MB
        </div>
      </div>
    </div>
  )
}
