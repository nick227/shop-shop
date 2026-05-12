import type { RiverPost } from '@api/types'
import { Card } from '@shared/ui/primitives'
import { PostMedia } from '../PostMedia'
import { PostActions } from '../PostActions/PostActions'
import { formatRelativeTime } from '@shared/lib/utils/format'
import { cn } from '@shared/lib/cn'

interface PostCardProps {
  readonly post: RiverPost
  readonly onLike?: (postId: string) => void
  readonly onComment?: (postId: string) => void
  readonly onShare?: (postId: string) => void
  readonly onSave?: (postId: string) => void
  readonly onPostClick?: (postId: string) => void
  /** Larger type + full-width media — e.g. store detail River block */
  readonly variant?: 'default' | 'store'
}

function StoreAvatar({ src, name, large }: { src?: string; name: string; large?: boolean }) {
  const frame = large ? 'w-12 h-12' : 'w-10 h-10'
  const initialText = large ? 'text-base' : 'text-sm'
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('object-cover rounded-full ring-1 ring-border', frame)}
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
        'flex flex-shrink-0 justify-center items-center rounded-full ring-1 bg-muted ring-border',
        frame,
      )}
    >
      <span className={cn('font-semibold text-muted-foreground', initialText)}>{initials || '?'}</span>
    </div>
  )
}

export function PostCard({
  post,
  onLike,
  onComment,
  onShare,
  onSave,
  onPostClick,
  variant = 'default',
}: PostCardProps) {
  const handleCardClick = () => {
    if (onPostClick && post.id) onPostClick(String(post.id))
  }

  const storeName = post.storeName ?? 'Store'
  const isStore = variant === 'store'

  return (
    <Card
      className={cn(
        'w-full overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200',
        isStore && 'rounded-xl border-border shadow-sm sm:rounded-2xl',
      )}
      onClick={handleCardClick}
    >
      <div className={cn(isStore ? 'p-5 sm:p-6 md:p-8' : 'p-4 sm:p-5')}>
        <header className={cn('flex gap-3 items-center', isStore ? 'mb-4' : 'mb-3')}>
          <StoreAvatar src={post.storeImage} name={storeName} large={isStore} />
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'font-semibold leading-tight truncate text-foreground',
                isStore ? 'text-base md:text-lg' : 'text-sm',
              )}
            >
              {storeName}
            </p>
            <time
              className={cn('text-secondary', isStore ? 'text-sm' : 'text-xs')}
              dateTime={post.createdAt}
            >
              {formatRelativeTime(post.createdAt ? new Date(post.createdAt) : new Date())}
            </time>
          </div>
        </header>

        {post.content && (
          <p
            className={cn(
              'leading-relaxed whitespace-pre-wrap text-body',
              isStore ? 'text-base md:text-[17px]' : 'text-sm',
            )}
          >
            {post.content}
          </p>
        )}
      </div>

      {post.media && post.media.length > 0 && (
        <div className={cn(isStore ? 'px-0' : 'px-4 sm:px-5')}>
          <PostMedia media={post.media} postId={post.id ?? ''} variant={variant} />
        </div>
      )}

      <div className={cn('border-t border-border', isStore ? 'px-4 py-2 sm:px-6 md:px-8' : 'px-3 sm:px-4')}>
        <PostActions
          post={post}
          onLike={onLike}
          onComment={onComment}
          onShare={onShare}
          onSave={onSave}
          density={isStore ? 'comfortable' : 'default'}
        />
      </div>
    </Card>
  )
}
