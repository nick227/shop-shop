import type { RiverComment } from '@api/types'
import { Button } from '@shared/ui/primitives'
import { formatRelativeTime } from '@shared/lib/utils/format'

interface PostCommentListProps {
  comments: RiverComment[]
  postId: string
  onLoadMore?: () => void
  hasMore?: boolean
  isLoading?: boolean
}

function CommentAvatar({ src, name }: { src?: string; name: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-1 ring-border"
      />
    )
  }
  const initial = name[0]?.toUpperCase() ?? '?'
  return (
    <div className="w-8 h-8 rounded-full flex-shrink-0 bg-muted flex items-center justify-center ring-1 ring-border">
      <span className="text-xs font-semibold text-muted-foreground">{initial}</span>
    </div>
  )
}

export const PostCommentList = ({
  comments,
  postId: _postId,
  onLoadMore,
  hasMore = false,
  isLoading = false,
}: PostCommentListProps) => {
  if (comments.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No comments yet. Be the first!
      </p>
    )
  }

  return (
    <div className="space-y-4 mt-3 pt-3 border-t border-border">
      {comments.map((comment) => (
        <article key={comment.id} className="flex gap-2.5">
          <CommentAvatar src={comment.userImage} name={comment.userName ?? 'User'} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-sm font-semibold text-foreground leading-tight">
                {comment.userName}
              </span>
              <time className="text-xs text-secondary flex-shrink-0">
                {formatRelativeTime(
                  comment.createdAt ? new Date(comment.createdAt) : new Date()
                )}
              </time>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>
          </div>
        </article>
      ))}

      {hasMore && (
        <div className="pt-1">
          <Button
            variant="ghost"
            size="small"
            onClick={onLoadMore}
            disabled={isLoading}
            fullWidth
          >
            {isLoading ? 'Loading...' : 'Load more comments'}
          </Button>
        </div>
      )}
    </div>
  )
}
