import { useState } from 'react'
import { Button } from '@ui/Button'
import { Card } from '@ui/Card'
import { MediaPreview } from '../MediaPreview'
import { useMediaDetection } from '@hooks/useMediaDetection'
import type { MediaItem } from '@api/types'

interface PostComposerProps {
  storeId: string // UUID;
  storeName: string;
  storeImage?: string;
  onPost: (content: string, media: MediaItem[]) => Promise<void>
  onCancel?: () => void;
}

export const PostComposer = ({
  storeId: _storeId,
  storeName,
  storeImage,
  onPost,
  onCancel}: PostComposerProps) => {
  const [content, setContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  
  // Auto-detect media from text;
  const { detectedMedia, removeMedia, clearMedia } = useMediaDetection(content)

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    if (!content.trim() && detectedMedia.length === 0) {
      return;
    }

    setIsPosting(true)
    try {
      await onPost(content, detectedMedia)
      setContent('')
      clearMedia()
    } catch (error: any) {
      console.error('Failed to create post:', error)
    } finally {
      setIsPosting(false)
    }
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to submit;
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      if (!isPosting && (content.trim().length > 0 || detectedMedia.length > 0)) {
        handleSubmit()
      }
    }
  }

  const handleRemoveMedia = (index: number) => {
    removeMedia(index)
  }

  const isValid = content.trim().length > 0 || detectedMedia.length > 0;
  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit}>
        <header className="flex items-center gap-3 mb-4">
          {storeImage && (
            <img
              src={storeImage}
              alt={storeName}
              className="w-10 h-10 rounded-full"
            />
          )}
          <span className="font-semibold text-foreground">{storeName}</span>
        </header>

        <textarea
          className="w-full min-h-32 p-3 border border-input rounded-lg resize-none bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
          placeholder="Share a YouTube video, image, or what's happening in your store... (Ctrl+Enter to post)"
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          rows={4}
          maxLength={5000}
          disabled={isPosting}
        />

        {detectedMedia.length > 0 && (
          <div className="mb-4">
            <MediaPreview
              media={detectedMedia}
              onRemove={handleRemoveMedia}
              editable={!isPosting}
            />
          </div>
        )}

        <footer className="flex justify-between items-center mt-4">
          <div className="flex gap-4 text-sm text-muted-foreground">
            {detectedMedia.length > 0 && (
              <span className="font-medium">
                {detectedMedia.length} media item{detectedMedia.length > 1 ? 's' : ''} detected
              </span>
            )}
            {content.length > 4500 && (
              <span className={content.length >= 5000 ? 'text-destructive font-semibold' : ''}>
                {content.length}/5000
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={isPosting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              disabled={!isValid || isPosting}
            >
              {isPosting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </footer>
      </form>
    </Card>
  )
}
