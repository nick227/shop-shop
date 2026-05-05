import { useState } from 'react'
import { Button, Card } from '@shared/ui/primitives'
import { MediaPreview } from '../MediaPreview/MediaPreview'
import { useMediaDetection } from '@shared/hooks/hooks/useMediaDetection'
import type { MediaItem } from '@api/types'

interface PostComposerProps {
  storeId: string
  storeName: string
  storeImage?: string
  onPost: (content: string, media: MediaItem[]) => Promise<void>
  onCancel?: () => void
}

function ComposerAvatar({ src, name }: { src?: string; name: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-1 ring-border"
      />
    )
  }
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
  return (
    <div className="w-9 h-9 rounded-full flex-shrink-0 bg-muted flex items-center justify-center ring-1 ring-border">
      <span className="text-xs font-semibold text-muted-foreground">{initials || '?'}</span>
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
}: PostComposerProps) => {
  const [content, setContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)

  const { detectedMedia, removeMedia, clearMedia } = useMediaDetection(content)

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

  const isValid = content.trim().length > 0 || detectedMedia.length > 0
  const charsLeft = MAX_CHARS - content.length
  const showCounter = content.length >= COUNTER_WARN_AT

  return (
    <Card className="overflow-hidden">
      <form onSubmit={(e) => { e.preventDefault(); void handleSubmit() }}>
        <div className="p-4 sm:p-5">
          <header className="flex items-center gap-3 mb-3">
            <ComposerAvatar src={storeImage} name={storeName} />
            <span className="font-semibold text-sm text-foreground">{storeName}</span>
          </header>

          <textarea
            className="w-full min-h-[100px] p-0 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:opacity-50 leading-relaxed"
            placeholder="Share what's happening in your store… (Ctrl+Enter to post)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            maxLength={MAX_CHARS}
            disabled={isPosting}
          />

          {showCounter && (
            <p
              className={[
                'text-xs mt-1 text-right tabular-nums',
                charsLeft <= 0
                  ? 'text-destructive font-semibold'
                  : 'text-muted-foreground',
              ].join(' ')}
            >
              {charsLeft}
            </p>
          )}
        </div>

        {detectedMedia.length > 0 && (
          <div className="px-4 sm:px-5 pb-3">
            <MediaPreview
              media={detectedMedia}
              onRemove={removeMedia}
              editable={!isPosting}
            />
          </div>
        )}

        <footer className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-border bg-muted/40">
          <p className="text-xs text-muted-foreground">
            {detectedMedia.length > 0 && (
              <span>{detectedMedia.length} media detected</span>
            )}
          </p>
          <div className="flex gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="small"
                onClick={onCancel}
                disabled={isPosting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="small"
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
