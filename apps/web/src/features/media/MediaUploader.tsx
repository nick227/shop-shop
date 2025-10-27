/**
 * MediaUploader - Upload and manage media files for stores and items
 */
import { useState, useRef } from 'react'
import { Button } from '@ui'
import { useMediaUpload, useMediaList, useMediaDelete } from '../../hooks/vendor'
import { toast } from 'sonner'
import type { MediaApiResponse } from '@api/types'
import { 
  compressImage, 
  shouldCompressFile, 
  formatFileSize,
  isSignificantCompression 
} from '../../utils/media-compression'

interface MediaUploaderProps {
  storeId?: string
  itemId?: string
  maxFiles?: number
}

export function MediaUploader({ storeId, itemId, maxFiles = 10 }: MediaUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined)
  const [isCompressing, setIsCompressing] = useState(false)
  const [savedPercent, setSavedPercent] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const uploadMutation = useMediaUpload()
  const { data: mediaFiles = [], isLoading } = useMediaList({ 
    storeId: storeId || '', 
    itemId: itemId || '' 
  })
  const deleteMutation = useMediaDelete()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Please select an image or video file')
      return
    }

    // Validate file size
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 50MB')
      return
    }

    // Compress images automatically
    if (shouldCompressFile(file)) {
      setIsCompressing(true)
      const result = await compressImage(file)
      setIsCompressing(false)
      
      setSelectedFile(result.file)
      setSavedPercent(result.savedPercent)
      
      // Show success message for significant compression
      if (isSignificantCompression(result)) {
        toast.success(
          'Image optimized: ${result.savedPercent}% smaller (saved ' + formatFileSize(result.savedBytes) + ')'
        )
      }
    } else {
      // Videos upload as-is
      setSelectedFile(file)
      setSavedPercent(0)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    if (mediaFiles.length >= maxFiles) {
      toast.error('Maximum ' + maxFiles + ' files allowed')
      return
    }

    await uploadMutation.mutateAsync({
      file: selectedFile,
      storeId: storeId || '',
      itemId: itemId || '',
      sortIndex: mediaFiles.length,
    })

    // Reset state
    setSelectedFile(undefined)
    setSavedPercent(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return
    
    await deleteMutation.mutateAsync({
      mediaId,
      storeId: storeId || '',
      itemId: itemId || '',
    })
  }

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700">
          Upload Media ({mediaFiles.length}/{maxFiles})
        </label>
        
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={uploadMutation.isPending || mediaFiles.length >= maxFiles || isCompressing}
          />
          
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending || isCompressing}
            variant="primary"
            size="small"
          >
            {uploadMutation.isPending ? 'Uploading...' : (isCompressing ? 'Optimizing...' : 'Upload')}
          </Button>
        </div>

        {isCompressing && (
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Optimizing image...</span>
          </div>
        )}

        {selectedFile && !isCompressing && (
          <div className="text-xs text-gray-600">
            <strong>Ready:</strong> {selectedFile.name} ({formatFileSize(selectedFile.size)})
            {savedPercent > 0 && (
              <span className="text-green-600 ml-2">
                ✓ {savedPercent}% smaller
              </span>
            )}
          </div>
        )}
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="text-sm text-gray-500">Loading media...</div>
      ) : (mediaFiles.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaFiles.map((media: MediaApiResponse) => (
            <div key={media.id} className="relative group">
              {/* Media Preview */}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {media.kind === 'IMAGE' ? (
                  <img
                    src={media.url}
                    alt={media.altText || 'Media'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={media.url}
                    className="w-full h-full object-cover"
                    controls
                  />
                )}
              </div>

              {/* Delete Button */}
              <button
                onClick={() => handleDelete(media.id)}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                disabled={deleteMutation.isPending}
                title="Delete media"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Media Type Badge */}
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {media.kind}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          No media uploaded yet. Add images or videos to showcase your {storeId ? 'store' : 'item'}.
        </div>
      ))}
    </div>
  )
}

