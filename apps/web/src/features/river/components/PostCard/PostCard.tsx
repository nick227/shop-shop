import type { RiverPost } from '../../../../api/types'
import { Card } from '../../../../components/ui'
import { PostMedia } from '../PostMedia'
import { PostActions } from '../PostActions'
import { formatRelativeTime } from '../../../../utils/format'

interface PostCardProps {
  post: RiverPost
  onLike?: ((postId: string) => void) | undefined
  onComment?: ((postId: string) => void) | undefined
  onShare?: ((postId: string) => void) | undefined
  onPostClick?: ((postId: string) => void) | undefined
}

export const PostCard = ({
  post,
  onLike,
  onComment,
  onShare,
  onPostClick,
}: PostCardProps) => {
  const handleCardClick = () => {
    if (onPostClick) {
      onPostClick(post.id)
    }
  }

  return (
    <Card className="p-6 cursor-pointer" onClick={handleCardClick}>
      <header className="flex items-start gap-3 mb-4">
        <div className="flex items-center gap-3">
          {post.storeImage && (
            <img
              src={post.storeImage}
              alt={post.storeName}
              className="w-12 h-12 rounded-full"
            />
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{post.storeName}</h3>
            <time className="text-sm text-muted-foreground">
              {formatRelativeTime(post.createdAt)}
            </time>
          </div>
        </div>
      </header>

      {post.content && (
        <div className="text-foreground mb-4">
          <p className="whitespace-pre-wrap">{post.content}</p>
        </div>
      )}

      {post.media && post.media.length > 0 && (
        <PostMedia media={post.media} postId={post.id} />
      )}

      <PostActions
        post={post}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
      />
    </Card>
  )
}

