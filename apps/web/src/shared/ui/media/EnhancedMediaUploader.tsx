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
  /**
   * While store/item id is missing (e.g. new store form), hold File objects locally and upload after save.
   */
  pendingUntilScoped?: {
    readonly files: readonly File[]
    onFilesChange: (files: File[]) => void
  }
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
  pendingUntilScoped,
}) => {
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [showCamera, setShowCamera] = useState(false)
  const previewUrlsRef = useRef<Set<string>>(new Set())
  const [scopedQueuePreviewUrls, setScopedQueuePreviewUrls] = useState<string[]>([])

  const hasScope = Boolean(storeId || itemId)
  const useScopedQueue =
    Boolean(pendingUntilScoped) && !hasScope

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

  useEffect(() => {
    if (!useScopedQueue || !pendingUntilScoped) {
      setScopedQueuePreviewUrls([])
      return
    }
    const urls = pendingUntilScoped.files.map((f) => URL.createObjectURL(f))
    setScopedQueuePreviewUrls(urls)
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [pendingUntilScoped?.files, useScopedQueue])

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

    if (useScopedQueue && pendingUntilScoped) {
      const room = maxFiles - pendingUntilScoped.files.length
      if (room <= 0) {
        onError?.(`Maximum ${maxFiles} files`)
        return
      }
      pendingUntilScoped.onFilesChange([...pendingUntilScoped.files, capturedFile])
      return
    }

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
  }, [storeId, itemId, onUploadComplete, onError, useScopedQueue, pendingUntilScoped, maxFiles])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!hasScope) {
      if (useScopedQueue && pendingUntilScoped) {
        const room = Math.max(0, maxFiles - pendingUntilScoped.files.length)
        const slice = acceptedFiles.slice(0, room)
        if (slice.length === 0) return
        pendingUntilScoped.onFilesChange([...pendingUntilScoped.files, ...slice])
        return
      }
      onError?.('Store ID or Item ID is required for media uploads')
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
  }, [storeId, itemId, onUploadComplete, onError, hasScope, useScopedQueue, pendingUntilScoped, maxFiles])

  const queueFull =
    useScopedQueue &&
    (pendingUntilScoped?.files.length ?? 0) >= maxFiles

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
      'video/*': ['.mp4', '.webm', '.mov'],
    },
    maxFiles,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: disabled || Boolean(queueFull),
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
        return <div className="w-4 h-4 rounded-full border-2 border-blue-500 animate-spin border-t-transparent" />
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
              {useScopedQueue
                ? 'Files are saved with your browser until you create the store — then they upload automatically.'
                : 'Drag & drop images or videos, or click to browse'}
            </div>
            <div className="text-xs text-gray-400">
              <div className="flex justify-center items-center space-x-4">
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
              disabled={disabled || Boolean(queueFull)}
              onClick={() => setShowCamera(true)}
              className="flex justify-center items-center px-4 py-3 space-x-2 text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg"
            >
              <Camera className="w-5 h-5" />
              <span className="font-medium">📸 Use Camera</span>
            </button>
          </div>
        </div>

        {/* Drag Overlay */}
        {isDragging && (
          <div className="flex absolute inset-0 justify-center items-center bg-blue-500 bg-opacity-10 rounded-xl">
            <div className="font-medium text-blue-600">
              <div className="mb-2 text-2xl">📁</div>
              Drop to upload
            </div>
          </div>
        )}
      </div>

      {useScopedQueue && pendingUntilScoped && pendingUntilScoped.files.length > 0 && (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="text-sm font-medium text-amber-900">
            {pendingUntilScoped.files.length} file{pendingUntilScoped.files.length !== 1 ? 's' : ''} ready — uploads after you save the store
          </div>
          <div className="space-y-2">
            {pendingUntilScoped.files.map((file, index) => (
              <div
                key={`${file.name}-${file.size}-${String(index)}`}
                className="flex items-center gap-3 rounded-lg border border-amber-100 bg-white p-3"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {scopedQueuePreviewUrls[index] && file.type.startsWith('image/') ? (
                    <img
                      src={scopedQueuePreviewUrls[index]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Video className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-800">{file.name}</div>
                  <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                </div>
                <button
                  type="button"
                  className="shrink-0 p-1 text-gray-400 hover:text-gray-700"
                  onClick={() =>
                    pendingUntilScoped.onFilesChange(
                      pendingUntilScoped.files.filter((f) => f !== file),
                    )
                  }
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
                className="flex items-center p-3 space-x-3 bg-white rounded-lg border"
              >
                {/* Thumbnail */}
                <div className="overflow-hidden flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg">
                  {preview.type === 'image' ? (
                    <img
                      src={preview.preview}
                      alt={preview.file.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex justify-center items-center w-full h-full">
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
                      <span className="ml-2 text-red-500">{preview.error}</span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {preview.status === 'uploading' && (
                    <div className="mt-2 w-full h-1 bg-gray-200 rounded-full">
                      <div
                        className="h-1 bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress[preview.file.name] || 0}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                {preview.status === 'pending' && (
                  <button
                    onClick={() => removeFile(preview.file)}
                    className="p-1 text-gray-400 transition-colors hover:text-gray-600"
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
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
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
