import { useState } from 'react'
import { Button, Card } from '@shared/ui/primitives'
import { MediaPreview } from '../MediaPreview/MediaPreview'
import { useMediaDetection } from '@shared/hooks/hooks/useMediaDetection'
import type { MediaItem } from '@api/types'
import { cn } from '@shared/lib/cn'

interface PostComposerProps {
  storeId: string
  storeName: string
  storeImage?: string
  onPost: (content: string, media: MediaItem[]) => Promise<void>
  onCancel?: () => void
  readonly variant?: 'default' | 'prominent'
}

function ComposerAvatar({ src, name, large }: { src?: string; name: string; large?: boolean }) {
  const frame = large ? 'w-11 h-11' : 'w-9 h-9'
  const initialCls = large ? 'text-sm' : 'text-xs'
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover flex-shrink-0 ring-1 ring-border', frame)}
      />
    )
  }
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
  return (
    <div
      className={cn(
        'rounded-full flex-shrink-0 bg-muted flex items-center justify-center ring-1 ring-border',
        frame,
      )}
    >
      <span className={cn('font-semibold text-muted-foreground', initialCls)}>{initials || '?'}</span>
    </div>
  )
}

const MAX_CHARS = 5000
const COUNTER_WARN_AT = 4500

export const PostComposer = ({
  storeId: _storeId,
  storeName,
  storeImage,
  onPost,
  onCancel,
  variant = 'default',
}: PostComposerProps) => {
  const prominent = variant === 'prominent'
  const [content, setContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [showMediaUploader, setShowMediaUploader] = useState(false)
  const [showCamera, setShowCamera] = useState(false)

  const { detectedMedia, removeMedia, clearMedia, addMedia } = useMediaDetection(content)

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!content.trim() && detectedMedia.length === 0) return

    setIsPosting(true)
    try {
      await onPost(content, detectedMedia)
      setContent('')
      clearMedia()
    } catch (error: unknown) {
      console.error('Failed to create post:', error)
    } finally {
      setIsPosting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      if (!isPosting && (content.trim().length > 0 || detectedMedia.length > 0)) {
        void handleSubmit()
      }
    }
  }

  const handleCameraCapture = () => {
    setShowCamera(true)
  }

  const handleCameraFileCapture = (file: File) => {
    const mediaItem: MediaItem = {
      type: 'image',
      url: URL.createObjectURL(file),
      thumbnail: URL.createObjectURL(file),
    }
    addMedia(mediaItem)
    setShowCamera(false)
  }

  const handleMediaSelect = (file: File) => {
    const mediaItem: MediaItem = {
      type: file.type.startsWith('image/') ? 'image' : 'video',
      url: URL.createObjectURL(file),
      thumbnail: file.type.startsWith('video/') ? undefined : URL.createObjectURL(file),
    }
    addMedia(mediaItem)
  }

  const closeCamera = () => {
    setShowCamera(false)
  }

  const handleMediaUpload = () => {
    setShowMediaUploader(true)
  }

  const closeMediaUploader = () => {
    setShowMediaUploader(false)
  }

  const isValid = content.trim().length > 0 || detectedMedia.length > 0
  const charsLeft = MAX_CHARS - content.length
  const showCounter = content.length >= COUNTER_WARN_AT

  if (showMediaUploader) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Upload Media</h2>
            <button
              onClick={closeMediaUploader}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="p-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Choose files
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              className="w-full text-sm"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? [])
                for (const file of files) {
                  handleMediaSelect(file)
                }
                setShowMediaUploader(false)
                e.target.value = ''
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  if (showCamera) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
          <h2 className="text-lg font-semibold">Take photo</h2>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="w-full text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleCameraFileCapture(file)
              e.target.value = ''
            }}
          />
          <Button type="button" variant="outline" size="small" onClick={closeCamera}>
            Close
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card
      className={cn(
        'overflow-hidden w-full',
        prominent && 'rounded-xl border-border shadow-md sm:rounded-2xl',
      )}
    >
      <form onSubmit={(e) => { e.preventDefault(); void handleSubmit() }}>
        <div className={cn(prominent ? 'p-5 sm:p-6 md:p-8' : 'p-4 sm:p-5')}>
          <header className={cn('flex items-center gap-3', prominent ? 'mb-4' : 'mb-3')}>
            <ComposerAvatar src={storeImage} name={storeName} large={prominent} />
            <span
              className={cn(
                'font-semibold text-foreground',
                prominent ? 'text-base md:text-lg' : 'text-sm',
              )}
            >
              {storeName}
            </span>
          </header>

          <textarea
            className={cn(
              'w-full p-0 resize-none bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:opacity-50 leading-relaxed',
              prominent
                ? 'min-h-[128px] text-base md:text-[17px]'
                : 'min-h-[100px] text-sm',
            )}
            placeholder="Share what's happening in your store… (Ctrl+Enter to post)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={prominent ? 5 : 4}
            maxLength={MAX_CHARS}
            disabled={isPosting}
          />

          {showCounter && (
            <p
              className={cn(
                'mt-1 text-right tabular-nums',
                prominent ? 'text-sm' : 'text-xs',
                charsLeft <= 0 ? 'text-destructive font-semibold' : 'text-muted-foreground',
              )}
            >
              {charsLeft}
            </p>
          )}
        </div>

        {detectedMedia.length > 0 && (
          <div className={cn(prominent ? 'px-5 pb-4 sm:px-6 md:px-8' : 'px-4 sm:px-5 pb-3')}>
            <MediaPreview
              media={detectedMedia}
              onRemove={removeMedia}
              editable={!isPosting}
            />
          </div>
        )}

        <footer
          className={cn(
            'flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/40',
            prominent ? 'px-5 py-4 sm:px-6 md:px-8' : 'px-4 sm:px-5 py-3',
          )}
        >
          <p className={cn('text-muted-foreground', prominent ? 'text-sm' : 'text-xs')}>
            {detectedMedia.length > 0 && (
              <span>{detectedMedia.length} media detected</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              size={prominent ? 'medium' : 'small'}
              onClick={handleMediaUpload}
              disabled={isPosting}
              title="Upload media"
            >
              📎 Upload
            </Button>

            <Button
              type="button"
              variant="ghost"
              size={prominent ? 'medium' : 'small'}
              onClick={handleCameraCapture}
              disabled={isPosting}
              title="Take photo"
            >
              📷 Camera
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size={prominent ? 'medium' : 'small'}
                onClick={onCancel}
                disabled={isPosting}
              >
                Cancel
              </Button>
            )}

            <Button
              type="submit"
              variant="primary"
              size={prominent ? 'medium' : 'small'}
              disabled={!isValid || isPosting}
              isLoading={isPosting}
            >
              Post
            </Button>
          </div>
        </footer>
      </form>
    </Card>
  )
}
