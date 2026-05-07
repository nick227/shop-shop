import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { authPost } from '@shared/lib/auth/authFetch'
import { Upload, X, File, Image, Video, AlertCircle, Check, Camera } from 'lucide-react'
import { CameraCapture } from './CameraCapture'

interface EnhancedMediaUploaderProps {
  storeId?: string
  itemId?: string
  onUploadComplete?: (media: any[]) => void
  onError?: (error: string) => void
  maxFiles?: number
  disabled?: boolean
}

interface FilePreview {
  file: File
  preview: string
  type: 'image' | 'video'
  size: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const EnhancedMediaUploader: React.FC<EnhancedMediaUploaderProps> = ({
  storeId,
  itemId,
  onUploadComplete,
  onError,
  maxFiles = 10,
  disabled = false,
}) => {
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [showCamera, setShowCamera] = useState(false)
  const previewUrlsRef = useRef<Set<string>>(new Set())

  const readJsonOrThrow = async <T,>(response: Response): Promise<T> => {
    const text = await response.text().catch(() => '')
    try {
      return JSON.parse(text) as T
    } catch {
      throw new Error(`Expected JSON but got: ${JSON.stringify(text.slice(0, 60))}`)
    }
  }

  const revokePreviewUrl = (previewUrl: string) => {
    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    previewUrlsRef.current.delete(previewUrl)
  }

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
      previewUrlsRef.current.clear()
    }
  }, [])

  const createFilePreview = async (file: File): Promise<FilePreview> => {
    const previewUrl = URL.createObjectURL(file)
    previewUrlsRef.current.add(previewUrl)
    return {
      file,
      preview: previewUrl,
      type: file.type.startsWith('image/') ? 'image' : 'video',
      size: formatFileSize(file.size),
      status: 'pending',
    }
  }

  const handleCameraCapture = useCallback(async (capturedFile: File) => {
    setShowCamera(false)
    
    try {
      
      // Create preview for captured image
      const preview = await createFilePreview(capturedFile)
      setFilePreviews(prev => [...prev, preview])

      // Upload the captured file
      setFilePreviews(prev => 
        prev.map(p => p.file === capturedFile ? { ...p, status: 'uploading' } : p)
      )

      const formData = new FormData()
      formData.append('file', capturedFile)
      if (storeId) formData.append('storeId', storeId)
      if (itemId) formData.append('itemId', itemId)

      let progressInterval: ReturnType<typeof setInterval> | undefined
      try {
        // Simulate upload progress
        progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[capturedFile.name] || 0
            if (current < 90) {
              return { ...prev, [capturedFile.name]: current + 10 }
            }
            return prev
          })
        }, 200)

        const response = await authPost('/api/media/upload', formData)

        if (!response.ok) {
          const error = await readJsonOrThrow<{ error?: string }>(response)
          throw new Error(error.error || 'Upload failed')
        }

        const result = await readJsonOrThrow<unknown>(response)
        onUploadComplete?.([result])
      
        // Update status to success
        setFilePreviews(prev => 
          prev.map(p => p.file === capturedFile ? { ...p, status: 'success' } : p)
        )
        setUploadProgress(prev => ({ ...prev, [capturedFile.name]: 100 }))

        // Remove from previews after a delay
        setTimeout(() => {
          setFilePreviews(prev => {
            const existing = prev.find(p => p.file === capturedFile)
            if (existing) revokePreviewUrl(existing.preview)
            return prev.filter(p => p.file !== capturedFile)
          })
          setUploadProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[capturedFile.name]
            return newProgress
          })
        }, 2000)
      } finally {
        if (progressInterval) clearInterval(progressInterval)
      }

    } catch (error) {
      // Update status to error
      setFilePreviews(prev => 
        prev.map(p => p.file === capturedFile ? { 
          ...p, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed' 
        } : p)
      )
      onError?.(error instanceof Error ? error.message : 'Upload failed')
    }
  }, [storeId, itemId, onUploadComplete, onError])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!storeId && !itemId) {
      onError?.('Store ID or Item ID is required')
      return
    }

    
    if (acceptedFiles.length === 0) return

    // Create previews for all files
    const previews = await Promise.all(acceptedFiles.map(createFilePreview))
    setFilePreviews(prev => [...prev, ...previews])

    const uploadedResults: unknown[] = []

    // Upload files one by one
    for (let i = 0; i < previews.length; i++) {
      const preview = previews[i]
      const { file } = preview

      try {
        // Update status to uploading
        setFilePreviews(prev => 
          prev.map(p => p.file === file ? { ...p, status: 'uploading' } : p)
        )

        const formData = new FormData()
        formData.append('file', file)
        if (storeId) formData.append('storeId', storeId)
        if (itemId) formData.append('itemId', itemId)

        let progressInterval: ReturnType<typeof setInterval> | undefined
        try {
          // Simulate upload progress
          progressInterval = setInterval(() => {
            setUploadProgress(prev => {
              const current = prev[file.name] || 0
              if (current < 90) {
                return { ...prev, [file.name]: current + 10 }
              }
              return prev
            })
          }, 200)

          const response = await authPost('/api/media/upload', formData)

          if (!response.ok) {
            const error = await readJsonOrThrow<{ error?: string }>(response)
            throw new Error(error.error || 'Upload failed')
          }

          const result = await readJsonOrThrow<unknown>(response)
          uploadedResults.push(result)
        
          // Update status to success
          setFilePreviews(prev => 
            prev.map(p => p.file === file ? { ...p, status: 'success' } : p)
          )
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))

          // Remove from previews after a delay
          setTimeout(() => {
            setFilePreviews(prev => {
              const existing = prev.find(p => p.file === file)
              if (existing) revokePreviewUrl(existing.preview)
              return prev.filter(p => p.file !== file)
            })
            setUploadProgress(prev => {
              const newProgress = { ...prev }
              delete newProgress[file.name]
              return newProgress
            })
          }, 2000)
        } finally {
          if (progressInterval) clearInterval(progressInterval)
        }

      } catch (error) {
        // Update status to error
        setFilePreviews(prev => 
          prev.map(p => p.file === file ? { 
            ...p, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Upload failed' 
          } : p)
        )
        onError?.(error instanceof Error ? error.message : 'Upload failed')
      }
    }

    if (uploadedResults.length > 0) {
      onUploadComplete?.(uploadedResults)
    }
  }, [storeId, itemId, onUploadComplete, onError])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
      'video/*': ['.mp4', '.webm', '.mov'],
    },
    maxFiles,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  })

  const removeFile = (file: File) => {
    setFilePreviews(prev => {
      const existing = prev.find(p => p.file === file)
      if (existing) revokePreviewUrl(existing.preview)
      return prev.filter(p => p.file !== file)
    })
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[file.name]
      return newProgress
    })
  }

  const getFileIcon = (type: 'image' | 'video') => {
    return type === 'image' ? <Image className="w-4 h-4" /> : <Video className="w-4 h-4" />
  }

  const getStatusIcon = (status: FilePreview['status']) => {
    switch (status) {
      case 'uploading':
        return <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
      case 'success':
        return <Check className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <>
      <div className="space-y-4">
      {/* Main Upload Area */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          {/* Upload Icon */}
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
            isDragging ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
          </div>

          {/* Upload Text */}
          <div className="space-y-2">
            <div className="text-lg font-semibold text-gray-700">
              {isDragging ? 'Drop files here' : 'Upload your media'}
            </div>
            <div className="text-sm text-gray-500">
              Drag & drop images or videos, or click to browse
            </div>
            <div className="text-xs text-gray-400">
              <div className="flex items-center justify-center space-x-4">
                <span>📷 Images (JPG, PNG, WebP)</span>
                <span>🎥 Videos (MP4, WebM)</span>
              </div>
              <div className="mt-1">
                Max {maxFiles} files • Up to 50MB each
              </div>
            </div>
          </div>

          {/* Camera Button */}
          <div className="pt-2 border-t">
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Camera className="w-5 h-5" />
              <span className="font-medium">📸 Take Photo with Camera</span>
            </button>
          </div>
        </div>

        {/* Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-xl flex items-center justify-center">
            <div className="text-blue-600 font-medium">
              <div className="text-2xl mb-2">📁</div>
              Drop to upload
            </div>
          </div>
        )}
      </div>

      {/* File Previews */}
      {filePreviews.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">
            Uploading {filePreviews.length} file{filePreviews.length > 1 ? 's' : ''}...
          </div>
          
          <div className="space-y-2">
            {filePreviews.map((preview) => (
              <div
                key={preview.file.name}
                className="flex items-center space-x-3 p-3 bg-white border rounded-lg"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {preview.type === 'image' ? (
                    <img
                      src={preview.preview}
                      alt={preview.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(preview.type)}
                    <div className="text-sm font-medium text-gray-700 truncate">
                      {preview.file.name}
                    </div>
                    {getStatusIcon(preview.status)}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {preview.size}
                    {preview.status === 'error' && preview.error && (
                      <span className="text-red-500 ml-2">{preview.error}</span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {preview.status === 'uploading' && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress[preview.file.name] || 0}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                {preview.status === 'pending' && (
                  <button
                    onClick={() => removeFile(preview.file)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Message */}
      {filePreviews.some(p => p.status === 'success') && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 text-green-700">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">
              {filePreviews.filter(p => p.status === 'success').length} file(s) uploaded successfully!
            </span>
          </div>
        </div>
      )}
    </div>

      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
      </>
  )
}
