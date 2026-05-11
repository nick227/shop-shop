import type { RiverPost } from '@api/types'
import { Card } from '@shared/ui/primitives'
import { PostMedia } from '../PostMedia'
import { PostActions } from '../PostActions/PostActions'
import { formatRelativeTime } from '@shared/lib/utils/format'

interface PostCardProps {
  readonly post: RiverPost
  readonly onLike?: (postId: string) => void
  readonly onComment?: (postId: string) => void
  readonly onShare?: (postId: string) => void
  readonly onSave?: (postId: string) => void
  readonly onPostClick?: (postId: string) => void
}

function StoreAvatar({ src, name }: { src?: string; name: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-1 ring-border"
      />
    )
  }
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
  return (
    <div className="w-10 h-10 rounded-full flex-shrink-0 bg-muted flex items-center justify-center ring-1 ring-border">
      <span className="text-sm font-semibold text-muted-foreground">{initials || '?'}</span>
    </div>
  )
}

export function PostCard({ post, onLike, onComment, onShare, onSave, onPostClick }: PostCardProps) {
  const handleCardClick = () => {
    if (onPostClick && post.id) onPostClick(String(post.id))
  }

  const storeName = post.storeName ?? 'Store'

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={handleCardClick}
    >
      <div className="p-4 sm:p-5">
        <header className="flex items-center gap-3 mb-3">
          <StoreAvatar src={post.storeImage} name={storeName} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-foreground truncate leading-tight">{storeName}</p>
            <time className="text-xs text-secondary" dateTime={post.createdAt}>
              {formatRelativeTime(post.createdAt ? new Date(post.createdAt) : new Date())}
            </time>
          </div>
        </header>

        {post.content && (
          <p className="text-sm text-body leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        )}
      </div>

      {post.media && post.media.length > 0 && (
        <div className="px-4 sm:px-5">
          <PostMedia media={post.media} postId={post.id ?? ''} />
        </div>
      )}

      <div className="px-3 sm:px-4 border-t border-border">
        <PostActions post={post} onLike={onLike} onComment={onComment} onShare={onShare} onSave={onSave} />
      </div>
    </Card>
  )
}
