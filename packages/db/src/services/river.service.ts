import { prisma } from '../client.js'
import type { Post, PostLike, Comment } from '../generated/client/index.js'

// ========================================
// River Service
// Functions for post/comment/like management
// ========================================

export interface MediaItem {
  type: 'youtube' | 'image' | 'video' | 'link'
  url: string
  thumbnail?: string
  title?: string
  provider?: string
  width?: number
  height?: number
}

export interface CreatePostInput {
  storeId: string
  content?: string
  mediaUrls: MediaItem[] // Enhanced from string[]
}

export interface CreateCommentInput {
  postId: string
  userId: string
  content: string
}

export interface PostWithDetails extends Post {
  store: {
    name: string
    media: Array<{ url: string }>
  }
  _count: {
    likes: number
    comments: number
  }
  likes: Array<{ userId: string }>
}

// ========================================
// Post Functions
// ========================================

export const createPost = async (input: CreatePostInput): Promise<Post> => {
  return prisma.post.create({
    data: {
      storeId: input.storeId,
      content: input.content,
      mediaUrls: input.mediaUrls as any, // Prisma JSON type
    },
  })
}

export const getPostById = async (id: string): Promise<PostWithDetails | null> => {
  return prisma.post.findUnique({
    where: { id },
    include: {
      store: {
        select: {
          name: true,
          media: {
            take: 1,
            orderBy: { sortIndex: 'asc' },
            select: { url: true },
          },
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
      likes: {
        select: { userId: true },
      },
    },
  }) as unknown as PostWithDetails | null
}

export const getPosts = async (options: {
  storeId?: string
  sortBy?: 'recent' | 'popular' | 'trending'
  hasMedia?: boolean
  page?: number
  pageSize?: number
  userId?: string
}): Promise<{ posts: PostWithDetails[]; total: number }> => {
  const {
    storeId,
    sortBy = 'recent',
    hasMedia,
    page = 1,
    pageSize = 20,
    userId,
  } = options

  const where: Record<string, unknown> = {}
  
  if (storeId) {
    where.storeId = storeId
  }

  if (hasMedia) {
    where.mediaUrls = {
      not: { equals: [] },
    }
  }

  const orderBy: Record<string, unknown>[] = []
  
  if (sortBy === 'recent') {
    orderBy.push({ createdAt: 'desc' })
  } else if (sortBy === 'popular') {
    orderBy.push({ likesCount: 'desc' }, { createdAt: 'desc' })
  } else if (sortBy === 'trending') {
    // Simple trending: most likes in last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    where.createdAt = { gte: sevenDaysAgo }
    orderBy.push({ likesCount: 'desc' }, { commentsCount: 'desc' })
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        store: {
          select: {
            name: true,
            media: {
              take: 1,
              orderBy: { sortIndex: 'asc' },
              select: { url: true },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        likes: userId ? {
          where: { userId },
          select: { userId: true },
        } : false,
      },
    }),
    prisma.post.count({ where }),
  ])

  return { posts: posts as PostWithDetails[], total }
}

export const deletePost = async (id: string): Promise<Post> => {
  return prisma.post.delete({
    where: { id },
  })
}

// ========================================
// Like Functions
// ========================================

export const likePost = async (postId: string, userId: string): Promise<PostLike> => {
  const like = await prisma.postLike.create({
    data: { postId, userId },
  })

  await prisma.post.update({
    where: { id: postId },
    data: { likesCount: { increment: 1 } },
  })

  return like
}

export const unlikePost = async (postId: string, userId: string): Promise<void> => {
  await prisma.postLike.delete({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
  })

  await prisma.post.update({
    where: { id: postId },
    data: { likesCount: { decrement: 1 } },
  })
}

export const getUserLike = async (
  postId: string,
  userId: string
): Promise<PostLike | null> => {
  return prisma.postLike.findUnique({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
  })
}

// ========================================
// Comment Functions
// ========================================

export const createComment = async (input: CreateCommentInput): Promise<Comment> => {
  const comment = await prisma.comment.create({
    data: {
      postId: input.postId,
      userId: input.userId,
      content: input.content,
    },
  })

  await prisma.post.update({
    where: { id: input.postId },
    data: { commentsCount: { increment: 1 } },
  })

  return comment
}

export const getCommentsByPostId = async (options: {
  postId: string
  page?: number
  pageSize?: number
}): Promise<{ comments: Array<Comment & { user: { name: string | null } }>; total: number }> => {
  const { postId, page = 1, pageSize = 20 } = options

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: { name: true },
        },
      },
    }),
    prisma.comment.count({ where: { postId } }),
  ])

  return { comments, total }
}

export const deleteComment = async (id: string): Promise<Comment> => {
  const comment = await prisma.comment.delete({
    where: { id },
  })

  await prisma.post.update({
    where: { id: comment.postId },
    data: { commentsCount: { decrement: 1 } },
  })

  return comment
}

