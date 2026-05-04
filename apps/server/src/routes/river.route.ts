import type { FastifyInstance } from 'fastify'
import {
  CreatePostInputSchema,
  CreateCommentInputSchema,
  PostQuerySchema,
  CommentQuerySchema,
  RiverFeedQuerySchema,
  UpdatePostPrioritySchema,
  type CreateCommentInput,
  type CommentQuery,
} from '@packages/schemas'
import {
  createPost,
  getPosts,
  getRiverFeed,
  getPostById,
  updatePostPriority,
  deletePost,
  likePost,
  unlikePost,
  getUserLike,
  createComment,
  getCommentsByPostId,
  deleteComment,
  RiverAutomationRejected,
  type CreatePostInput,
} from '@packages/db'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

export const riverRoutes = async (app: FastifyInstance) => {
  // ========================================
  // POST ROUTES
  // ========================================

  // GET /river/feed — cursor feed (home River contract)
  app.get('/river/feed', async (req, reply) => {
    try {
      const q = RiverFeedQuerySchema.parse(req.query)
      const page = await getRiverFeed({
        cursor: q.cursor,
        limit: q.limit,
        storeId: q.storeId,
        near: q.near,
        requireMedia: !q.allowEmptyMedia,
      })
      return reply.code(200).send(page)
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid cursor') {
        return reply.code(400).send({ error: 'Invalid cursor' })
      }
      if (error instanceof Error && 'issues' in error) {
        return reply.code(400).send({
          error: 'Validation error',
          issues: (error as { issues: unknown[] }).issues,
        })
      }
      throw error
    }
  })

  // GET /river/posts - List posts (public)
  app.get('/river/posts', async (req, reply) => {
    try {
      const raw = { ...(req.query as Record<string, string>) }
      if (raw.pageSize && raw.limit === undefined) {
        raw.limit = raw.pageSize
      }
      const query = PostQuerySchema.parse(raw) as {
        page: number
        limit: number
        filters: {
          storeId?: string
          sortBy?: 'recent' | 'popular' | 'trending'
          hasMedia?: boolean
          pageSize?: number
        }
      }
      const f = query.filters
      const pageSize = f.pageSize ?? query.limit

      // Get userId from auth if authenticated (optional)
      const userId = (req as { user?: { userId: string } }).user?.userId

      const { posts, total } = await getPosts({
        storeId: f.storeId,
        sortBy: f.sortBy ?? 'recent',
        hasMedia: f.hasMedia,
        page: query.page,
        pageSize,
        userId,
      })

      // Transform to match API schema
      const transformedPosts = posts.map((post) => ({
        id: post.id,
        storeId: post.storeId,
        storeName: post.store.name,
        storeImage: post.store.media[0]?.url,
        content: post.content,
        media: Array.isArray(post.mediaUrls) ? post.mediaUrls : [],
        priority: post.priority,
        layout: post.layout,
        source: post.source,
        linkedItemId: post.linkedItemId,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        sharesCount: post.sharesCount,
        isLiked: userId ? post.likes.some((like) => like.userId === userId) : false,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      }))

      return reply.code(200).send({
        data: transformedPosts,
        total,
        page: query.page,
        pageSize,
        hasMore: total > query.page * pageSize,
      })
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        return reply.code(400).send({
          error: 'Validation error',
          issues: (error as { issues: unknown[] }).issues,
        })
      }
      throw error
    }
  })

  // GET /river/posts/:id - Get post by ID (public)
  app.get('/river/posts/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const userId = (req as { user?: { userId: string } }).user?.userId

    const post = await getPostById(id)

    if (!post) {
      return reply.code(404).send({ error: 'Post not found' })
    }

    return reply.code(200).send({
      id: post.id,
      storeId: post.storeId,
      storeName: post.store.name,
      storeImage: post.store.media[0]?.url,
      content: post.content,
      media: Array.isArray(post.mediaUrls) ? post.mediaUrls : [],
      priority: post.priority,
      layout: post.layout,
      source: post.source,
      linkedItemId: post.linkedItemId,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      sharesCount: post.sharesCount,
      isLiked: userId ? post.likes.some((like) => like.userId === userId) : false,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    })
  })

  // POST /river/posts - Create post (vendor only)
  app.post(
    '/river/posts',
    {
      preHandler: [authenticate, requireRole(['USER', 'VENDOR', 'ADMIN'])],  // Open platform: any user can create posts
    },
    async (req, reply) => {
      try {
        const parsed = CreatePostInputSchema.parse(req.body)
        const input: CreatePostInput = {
          storeId: parsed.storeId,
          content: parsed.content,
          mediaUrls: parsed.mediaUrls ?? [],
          priority: parsed.priority,
          layout: parsed.layout,
          source: parsed.source,
          automationKey: parsed.automationKey,
          linkedItemId: parsed.linkedItemId,
        }

        // TODO: Verify user owns the store
        const userId = req.user!.id

        const post = await createPost(input)

        req.log.info({
          event: 'post_created',
          postId: post.id,
          storeId: post.storeId,
          userId,
        }, 'Post created successfully')

        return reply.code(201).send(post)
      } catch (error) {
        if (error instanceof RiverAutomationRejected) {
          return reply.code(409).send({ error: error.message, code: error.code })
        }
        if (error instanceof Error && 'issues' in error) {
          return reply.code(400).send({
            error: 'Validation error',
            issues: (error as { issues: unknown[] }).issues,
          })
        }
        throw error
      }
    }
  )

  // PATCH /river/posts/:id — adjust priority (curation); vendor/admin TODO: scope to store ownership
  app.patch(
    '/river/posts/:id',
    {
      preHandler: [authenticate, requireRole(['USER', 'VENDOR', 'ADMIN'])],
    },
    async (req, reply) => {
      try {
        const { id } = req.params as { id: string }
        const body = UpdatePostPrioritySchema.parse(req.body)
        const post = await updatePostPriority(id, body.priority)
        return reply.code(200).send(post)
      } catch (error) {
        if (error instanceof Error && 'issues' in error) {
          return reply.code(400).send({
            error: 'Validation error',
            issues: (error as { issues: unknown[] }).issues,
          })
        }
        throw error
      }
    },
  )

  // DELETE /river/posts/:id - Delete post (vendor only, own posts)
  app.delete(
    '/river/posts/:id',
    {
      preHandler: [authenticate, requireRole(['USER', 'VENDOR', 'ADMIN'])],  // Open platform: any user can delete their own posts
    },
    async (req, reply) => {
      const { id } = req.params as { id: string }
      const userId = req.user!.id

      // TODO: Verify user owns the store that owns the post

      await deletePost(id)

      req.log.info({
        event: 'post_deleted',
        postId: id,
        userId,
      }, 'Post deleted successfully')

      return reply.code(204).send()
    }
  )

  // ========================================
  // LIKE ROUTES
  // ========================================

  // POST /river/posts/:id/like - Like a post (authenticated)
  app.post(
    '/river/posts/:id/like',
    {
      preHandler: [authenticate],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string }
      const userId = req.user!.id

      // Check if already liked
      const existingLike = await getUserLike(id, userId)
      if (existingLike) {
        return reply.code(409).send({ error: 'Post already liked' })
      }

      await likePost(id, userId)

      req.log.info({
        event: 'post_liked',
        postId: id,
        userId,
      }, 'Post liked')

      return reply.code(201).send({ success: true })
    }
  )

  // DELETE /river/posts/:id/like - Unlike a post (authenticated)
  app.delete(
    '/river/posts/:id/like',
    {
      preHandler: [authenticate],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string }
      const userId = req.user!.id

      await unlikePost(id, userId)

      req.log.info({
        event: 'post_unliked',
        postId: id,
        userId,
      }, 'Post unliked')

      return reply.code(204).send()
    }
  )

  // ========================================
  // COMMENT ROUTES
  // ========================================

  // GET /river/posts/:id/comments - List comments (public)
  app.get('/river/posts/:id/comments', async (req, reply) => {
    try {
      const { id } = req.params as { id: string }
      const query = CommentQuerySchema.parse(req.query) as CommentQuery

      const { comments, total } = await getCommentsByPostId({
        postId: id,
        page: query.page,
        pageSize: query.pageSize,
      })

      const transformedComments = comments.map((comment) => ({
        id: comment.id,
        postId: comment.postId,
        userId: comment.userId,
        userName: comment.user.name || 'Anonymous',
        userImage: undefined,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      }))

      return reply.code(200).send({
        data: transformedComments,
        total,
        page: query.page,
        pageSize: query.pageSize,
        hasMore: total > query.page * query.pageSize,
      })
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        return reply.code(400).send({
          error: 'Validation error',
          issues: (error as { issues: unknown[] }).issues,
        })
      }
      throw error
    }
  })

  // POST /river/posts/:id/comments - Create comment (authenticated)
  app.post(
    '/river/posts/:id/comments',
    {
      preHandler: [authenticate],
    },
    async (req, reply) => {
      try {
        const { id } = req.params as { id: string }
        const userId = req.user!.id
        const input = CreateCommentInputSchema.parse({
          ...(req.body as Record<string, unknown>),
          postId: id,
        }) as CreateCommentInput

        const comment = await createComment({
          postId: id,
          userId,
          content: input.content,
        })

        req.log.info({
          event: 'comment_created',
          commentId: comment.id,
          postId: id,
          userId,
        }, 'Comment created successfully')

        return reply.code(201).send(comment)
      } catch (error) {
        if (error instanceof Error && 'issues' in error) {
          return reply.code(400).send({
            error: 'Validation error',
            issues: (error as { issues: unknown[] }).issues,
          })
        }
        throw error
      }
    }
  )

  // DELETE /river/comments/:id - Delete comment (authenticated, own comments)
  app.delete(
    '/river/comments/:id',
    {
      preHandler: [authenticate],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string }
      const userId = req.user!.id

      // TODO: Verify user owns the comment

      await deleteComment(id)

      req.log.info({
        event: 'comment_deleted',
        commentId: id,
        userId,
      }, 'Comment deleted successfully')

      return reply.code(204).send()
    }
  )
}

