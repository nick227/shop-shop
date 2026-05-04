import type { RiverComment } from '@api/types'
import { Button } from '@shared/ui/primitives'

interface PostCommentListProps {
  comments: RiverComment[]
  postId: string // UUID;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

export const PostCommentList = ({
  comments,
  postId: _postId,
  onLoadMore,
  hasMore = false,
  isLoading = false}: PostCommentListProps) => {
  const formatTimestamp = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return '' + Math.floor(diffInSeconds / 60) + 'm ago'
    if (diffInSeconds < 86_400) return '' + Math.floor(diffInSeconds / 3600) + 'h ago'
    return date.toLocaleDateString()
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No comments yet. Be the first to comment!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-border">
      {comments.map((comment) => (
        <article key={comment.id} className="flex gap-3">
          <div className="flex items-center gap-2 mb-2">
            {comment.userImage && (
              <img
                src={comment.userImage}
                alt={comment.userName}
                className="w-8 h-8 rounded-full"
              />
            )}
            <div className="flex-1">
              <h5 className="font-semibold text-sm text-foreground">{comment.userName}</h5>
              <time className="text-xs text-muted-foreground">
                {formatTimestamp(comment.createdAt)}
              </time>
            </div>
          </div>
          <div className="flex-1 bg-muted rounded-lg p-3">
            <p className="text-sm text-foreground">{comment.content}</p>
          </div>
        </article>
      ))}

      {hasMore && (
        <div className="text-center mt-4">
          <Button
            variant="secondary"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load more comments'}
          </Button>
        </div>
      )}
    </div>
  )
}


