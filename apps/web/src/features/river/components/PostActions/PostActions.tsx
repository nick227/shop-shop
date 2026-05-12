import type { RiverPost } from '@api/types'
import { formatCount } from '@shared/lib/utils/media'
import { cn } from '@shared/lib/cn'

interface PostActionsProps {
  readonly post: RiverPost
  readonly onLike?: (postId: string) => void
  readonly onComment?: (postId: string) => void
  readonly onShare?: (postId: string) => void
  readonly onSave?: (postId: string) => void
  readonly density?: 'default' | 'comfortable'
}

export const PostActions = ({
  post,
  onLike,
  onComment,
  onShare,
  onSave,
  density = 'default',
}: PostActionsProps) => {
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onLike && post.id) onLike(String(post.id))
  }

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onComment && post.id) onComment(String(post.id))
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onShare && post.id) onShare(String(post.id))
  }

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onSave && post.id) onSave(String(post.id))
  }

  const comfy = density === 'comfortable'

  return (
    <footer className={cn('flex items-center gap-1 -mx-1', comfy ? 'gap-2 py-2' : 'py-1')}>
      <button
        onClick={handleLike}
        aria-label={post.isLiked ? 'Unlike post' : 'Like post'}
        aria-pressed={post.isLiked}
        className={cn(
          'flex items-center font-medium transition-all duration-150 tap-scale',
          comfy
            ? 'gap-2 min-h-12 px-4 rounded-xl text-base'
            : 'gap-1.5 min-h-10 px-3 rounded-lg text-sm',
          post.isLiked
            ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted',
        )}
      >
        <svg
          className={cn('flex-shrink-0', comfy ? 'w-5 h-5' : 'w-[18px] h-[18px]')}
          viewBox="0 0 24 24"
          fill={post.isLiked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <span>{formatCount(Number(post.likesCount ?? 0))}</span>
      </button>

      <button
        onClick={handleComment}
        aria-label="Comment on post"
        className={cn(
          'flex items-center font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 tap-scale',
          comfy
            ? 'gap-2 min-h-12 px-4 rounded-xl text-base'
            : 'gap-1.5 min-h-10 px-3 rounded-lg text-sm',
        )}
      >
        <svg
          className={cn('flex-shrink-0', comfy ? 'w-5 h-5' : 'w-[18px] h-[18px]')}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>{formatCount(Number(post.commentsCount ?? 0))}</span>
      </button>

      {onSave ? (
        <button
          onClick={handleSave}
          aria-label={post.isSaved ? 'Remove saved post' : 'Save post'}
          aria-pressed={post.isSaved}
          className={cn(
            'flex items-center font-medium transition-all duration-150 tap-scale',
            comfy
              ? 'gap-2 min-h-12 px-4 rounded-xl text-base'
              : 'gap-1.5 min-h-10 px-3 rounded-lg text-sm',
            post.isSaved
              ? 'text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          )}
        >
          <svg
            className={cn('flex-shrink-0', comfy ? 'w-5 h-5' : 'w-[18px] h-[18px]')}
            viewBox="0 0 24 24"
            fill={post.isSaved ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      ) : null}

      <button
        onClick={handleShare}
        aria-label="Share post"
        className={cn(
          'flex items-center font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 tap-scale ml-auto',
          comfy
            ? 'gap-2 min-h-12 px-4 rounded-xl text-base'
            : 'gap-1.5 min-h-10 px-3 rounded-lg text-sm',
        )}
      >
        <svg
          className={cn('flex-shrink-0', comfy ? 'w-5 h-5' : 'w-[18px] h-[18px]')}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span>{formatCount(Number(post.sharesCount ?? 0))}</span>
      </button>
    </footer>
  )
}
