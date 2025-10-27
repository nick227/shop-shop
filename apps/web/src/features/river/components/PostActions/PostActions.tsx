import type { RiverPost } from '../../../../api/types'
import { formatCount } from '../../../../utils/media'

interface PostActionsProps {
  readonly post: RiverPost
  readonly onLike?: (postId: string) => void
  readonly onComment?: (postId: string) => void
  readonly onShare?: (postId: string) => void
}

export const PostActions = ({
  post,
  onLike,
  onComment,
  onShare,
}: PostActionsProps) => {
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onLike && post.id) {
      onLike(String(post.id))
    }
  }

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onComment && post.id) {
      onComment(String(post.id))
    }
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onShare && post.id) {
      onShare(String(post.id))
    }
  }

  return (
    <footer className="flex items-center gap-6 pt-4 border-t border-border">
      <button
        className={`flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors ${post.isLiked ? 'text-red-600' : ''}`}
        onClick={handleLike}
        aria-label="Like post"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill={post.isLiked ? 'currentColor' : 'none'}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <span>{formatCount(Number(post.likesCount ?? 0))}</span>
      </button>

      <button
        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        onClick={handleComment}
        aria-label="Comment on post"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span>{formatCount(Number(post.commentsCount ?? 0))}</span>
      </button>

      <button
        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        onClick={handleShare}
        aria-label="Share post"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        <span>{formatCount(Number(post.sharesCount ?? 0))}</span>
      </button>
    </footer>
  )
}

