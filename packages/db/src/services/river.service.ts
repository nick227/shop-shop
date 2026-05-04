import { prisma } from '../client.js'
import type { Post, PostLike, Comment } from '../generated/client/index.js'
import { PostSource, Prisma } from '../generated/client/index.js'
import type { RiverFeedItem } from '@packages/schemas'
import { RIVER_AUTO_PRODUCT_COOLDOWN_HOURS } from './river.constants.js'
import { queryRiverFeedIdsStandard, queryRiverFeedIdsWithGeo } from './river-feed-query.js'

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
  mediaUrls: MediaItem[]
  priority?: number
  layout?: string
  source?: 'MANUAL' | 'AUTO_STORE' | 'AUTO_PRODUCT'
  automationKey?: string
  linkedItemId?: string
  /** If set, post stays hidden from public feed until this instant (UTC). Omitted = immediate. */
  publishAt?: Date
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

/** Rejected automation insert (cooldown, duplicate welcome, missing media). */
export class RiverAutomationRejected extends Error {
  readonly code: 'DUPLICATE_AUTO_STORE' | 'AUTO_PRODUCT_COOLDOWN' | 'AUTO_MISSING_MEDIA'

  constructor(
    code: RiverAutomationRejected['code'],
    message: string,
  ) {
    super(message)
    this.name = 'RiverAutomationRejected'
    this.code = code
  }
}

function sourceToWire(s: Post['source']): NonNullable<RiverFeedItem['source']> {
  if (s === PostSource.AUTO_STORE) return 'auto_store'
  if (s === PostSource.AUTO_PRODUCT) return 'auto_product'
  return 'manual'
}

function resolvePostSource(
  input?: CreatePostInput['source'],
): (typeof PostSource)[keyof typeof PostSource] {
  if (input === 'AUTO_STORE') return PostSource.AUTO_STORE
  if (input === 'AUTO_PRODUCT') return PostSource.AUTO_PRODUCT
  return PostSource.MANUAL
}

function parseRiverCursor(cursor: string): { p: number; t: string; id: string } {
  try {
    const raw = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as unknown
    if (!raw || typeof raw !== 'object') throw new Error('bad shape')
    const o = raw as Record<string, unknown>
    if (typeof o.p !== 'number' || typeof o.t !== 'string' || typeof o.id !== 'string') {
      throw new Error('bad fields')
    }
    return { p: o.p, t: o.t, id: o.id }
  } catch {
    throw new Error('Invalid cursor')
  }
}

function encodeRiverCursor(row: { priority: number; createdAt: Date; id: string }): string {
  return Buffer.from(
    JSON.stringify({ p: row.priority, t: row.createdAt.toISOString(), id: row.id }),
    'utf8',
  ).toString('base64url')
}

async function assertRiverAutomationAllowed(input: CreatePostInput): Promise<void> {
  const src = resolvePostSource(input.source)
  if (src === PostSource.MANUAL) return

  if (!input.mediaUrls?.length) {
    throw new RiverAutomationRejected(
      'AUTO_MISSING_MEDIA',
      'Automated River posts must include at least one media item',
    )
  }

  if (src === PostSource.AUTO_PRODUCT) {
    const since = new Date(Date.now() - RIVER_AUTO_PRODUCT_COOLDOWN_HOURS * 60 * 60 * 1000)
    const recent = await prisma.post.count({
      where: {
        storeId: input.storeId,
        source: PostSource.AUTO_PRODUCT,
        createdAt: { gte: since },
      },
    })
    if (recent >= 1) {
      throw new RiverAutomationRejected(
        'AUTO_PRODUCT_COOLDOWN',
        `At most one auto_product post per store per ${RIVER_AUTO_PRODUCT_COOLDOWN_HOURS} hour(s)`,
      )
    }
  }
}

function mapMediaJsonToRiver(raw: unknown): RiverFeedItem['media'] {
  if (!Array.isArray(raw)) return []
  const out: RiverFeedItem['media'] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const o = entry as Record<string, unknown>
    const url = typeof o.url === 'string' ? o.url : ''
    if (!url) continue
    const kind =
      o.type === 'video' || o.type === 'youtube' ? ('video' as const) : ('image' as const)
    const thumb = o.thumbnail
    out.push({
      type: kind,
      url,
      thumbnailUrl: typeof thumb === 'string' ? thumb : undefined,
      width: typeof o.width === 'number' ? o.width : undefined,
      height: typeof o.height === 'number' ? o.height : undefined,
    })
  }
  return out
}

type PostRowForRiver = Pick<
  Post,
  | 'id'
  | 'createdAt'
  | 'priority'
  | 'layout'
  | 'source'
  | 'storeId'
  | 'content'
  | 'mediaUrls'
  | 'linkedItemId'
> & {
  store: PostWithDetails['store']
}

function mapPostToRiverFeedItem(post: PostRowForRiver): RiverFeedItem {
  return {
    id: post.id,
    createdAt: post.createdAt.toISOString(),
    priority: post.priority,
    layout: post.layout,
    actor: {
      kind: 'store',
      storeId: post.storeId,
      displayName: post.store.name,
      avatarUrl: post.store.media[0]?.url,
    },
    title: null,
    body: post.content,
    media: mapMediaJsonToRiver(post.mediaUrls),
    source: sourceToWire(post.source),
    links: {
      storeId: post.storeId,
      ...(post.linkedItemId ? { itemId: post.linkedItemId } : {}),
    },
  }
}

// ========================================
// Post Functions
// ========================================

export const createPost = async (input: CreatePostInput): Promise<Post> => {
  const src = resolvePostSource(input.source)
  const automationKey =
    input.automationKey ??
    (src === PostSource.AUTO_STORE ? `auto_store:${input.storeId}` : input.automationKey)

  await assertRiverAutomationAllowed({ ...input, automationKey, source: input.source })

  try {
    return await prisma.post.create({
      data: {
        storeId: input.storeId,
        content: input.content,
        mediaUrls: input.mediaUrls as unknown as Prisma.InputJsonValue,
        priority: input.priority ?? 0,
        layout: input.layout ?? 'default_layout',
        source: src,
        automationKey,
        linkedItemId: input.linkedItemId,
        publishAt: input.publishAt,
      },
    })
  } catch (e) {
    if (
      src === PostSource.AUTO_STORE &&
      automationKey &&
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      const existing = await prisma.post.findUnique({ where: { automationKey } })
      if (existing) return existing
    }
    throw e
  }
}

export const updatePostPriority = async (
  postId: string,
  priority: number,
  scope?: Readonly<{ storeId: string }>,
): Promise<Post> => {
  return prisma.post.update({
    where: scope ? { id: postId, storeId: scope.storeId } : { id: postId },
    data: { priority },
  })
}

export const getPostById = async (id: string): Promise<PostWithDetails | null> => {
  return prisma.post.findFirst({
    where: {
      id,
      OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }],
    },
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

  const and: Prisma.PostWhereInput[] = [
    { store: { isPublished: true } },
    { OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }] },
  ]

  if (storeId) {
    and.push({ storeId })
  }

  if (hasMedia) {
    and.push({
      mediaUrls: {
        not: { equals: [] },
      },
    })
  }

  const where: Prisma.PostWhereInput = { AND: and }

  const orderBy: Record<string, unknown>[] = []
  const priorityFirst: Record<string, unknown>[] = [
    { priority: 'desc' },
    { createdAt: 'desc' },
    { id: 'desc' },
  ]

  if (sortBy === 'recent') {
    orderBy.push(...priorityFirst)
  } else if (sortBy === 'popular') {
    orderBy.push(
      { priority: 'desc' },
      { likesCount: 'desc' },
      { createdAt: 'desc' },
      { id: 'desc' },
    )
  } else if (sortBy === 'trending') {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    and.push({ createdAt: { gte: sevenDaysAgo } })
    orderBy.push(
      { priority: 'desc' },
      { likesCount: 'desc' },
      { commentsCount: 'desc' },
      { id: 'desc' },
    )
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

export const getRiverFeed = async (options: {
  cursor?: string
  limit: number
  storeId?: string
  near?: { lat: number; lng: number; radiusMiles: number }
  /** When true (default), exclude rows with empty mediaUrls JSON array */
  requireMedia?: boolean
}): Promise<{ items: RiverFeedItem[]; nextCursor: string | null }> => {
  const { cursor, limit, storeId, near } = options
  const requireMedia = options.requireMedia ?? true
  const take = limit + 1
  const decoded = cursor ? parseRiverCursor(cursor) : undefined

  const storeInclude = {
    select: {
      name: true,
      media: {
        take: 1,
        orderBy: { sortIndex: 'asc' as const },
        select: { url: true },
      },
    },
  }

  if (near !== undefined) {
    const ids = await queryRiverFeedIdsWithGeo(prisma, {
      take,
      cursor: decoded,
      storeId,
      near,
      requireMedia,
    })
    if (ids.length === 0) {
      return { items: [], nextCursor: null }
    }

    const unordered = await prisma.post.findMany({
      where: { id: { in: ids } },
      include: { store: storeInclude },
    })

    const byId = new Map(unordered.map((p) => [p.id, p]))
    const posts = ids
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined) as PostRowForRiver[]

    const hasMore = posts.length > limit
    const pageRows = hasMore ? posts.slice(0, limit) : posts
    const last = pageRows[pageRows.length - 1]
    const nextCursor =
      hasMore && last
        ? encodeRiverCursor({
            priority: last.priority,
            createdAt: last.createdAt,
            id: last.id,
          })
        : null

    return {
      items: pageRows.map(mapPostToRiverFeedItem),
      nextCursor,
    }
  }

  const ids = await queryRiverFeedIdsStandard(prisma, {
    take,
    cursor: decoded,
    storeId,
    requireMedia,
  })
  if (ids.length === 0) {
    return { items: [], nextCursor: null }
  }

  const unordered = await prisma.post.findMany({
    where: { id: { in: ids } },
    include: { store: storeInclude },
  })

  const byId = new Map(unordered.map((p) => [p.id, p]))
  const posts = ids
    .map((id) => byId.get(id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined) as PostRowForRiver[]

  const hasMore = posts.length > limit
  const pageRows = hasMore ? posts.slice(0, limit) : posts
  const last = pageRows[pageRows.length - 1]
  const nextCursor =
    hasMore && last
      ? encodeRiverCursor({
          priority: last.priority,
          createdAt: last.createdAt,
          id: last.id,
        })
      : null

  return {
    items: pageRows.map(mapPostToRiverFeedItem),
    nextCursor,
  }
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

