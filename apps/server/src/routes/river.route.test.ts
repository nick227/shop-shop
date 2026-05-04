import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import { authRoutes } from './auth.route.js'
import { riverRoutes } from './river.route.js'
import { ALL_RESOURCES } from '../resources/index.js'
import { registerAllResources } from './loader.js'
import { prisma } from '@packages/db'

const defaultRiverMedia = [
  { type: 'image' as const, url: 'https://example.com/river-default.jpg' },
]

/**
 * River Routes E2E Tests
 * Tests social feed functionality (posts, likes, comments)
 */
describe('River Routes E2E', () => {
  let app: FastifyInstance
  let user1Token: string
  let user2Token: string
  let user1Id: string
  let user2Id: string
  let storeId: string
  let postId: string

  beforeEach(async () => {
    // Create fresh server instance
    app = Fastify({ logger: false })
    await app.register(authRoutes)
    await app.register(riverRoutes)
    // Register only store resource (needed for creating test stores)
    const storeResource = ALL_RESOURCES.find(r => r.name === 'store')
    if (storeResource) {
      await registerAllResources(app, [storeResource])
    }
    await app.ready()

    // Clean up test data
    await prisma.comment.deleteMany({ where: { user: { email: { contains: '@river-test.com' } } } })
    await prisma.postLike.deleteMany({ where: { user: { email: { contains: '@river-test.com' } } } })
    await prisma.post.deleteMany({ where: { store: { slug: { contains: 'river-test' } } } })
    await prisma.store.deleteMany({ where: { slug: { contains: 'river-test' } } })
    await prisma.user.deleteMany({ where: { email: { contains: '@river-test.com' } } })

    // Create user 1
    const user1Signup = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: {
        email: 'user1@river-test.com',
        password: 'Password123!',
        name: 'User One',
      },
    })
    const user1Data = JSON.parse(user1Signup.body)
    user1Token = user1Data.token
    user1Id = user1Data.user.id

    // Create user 2
    const user2Signup = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: {
        email: 'user2@river-test.com',
        password: 'Password123!',
        name: 'User Two',
      },
    })
    const user2Data = JSON.parse(user2Signup.body)
    user2Token = user2Data.token
    user2Id = user2Data.user.id

    // Create a test store
    const storeResponse = await app.inject({
      method: 'POST',
      url: '/stores',
      headers: {
        authorization: `Bearer ${user1Token}`,
      },
      payload: {
        name: 'River Test Store',
        slug: 'river-test-store-' + Date.now(),
        description: 'Test store for river',
        phone: '555-1234',
        email: 'store@river-test.com',
      },
    })
    const storeData = JSON.parse(storeResponse.body)
    storeId = storeData.id

    await prisma.store.update({
      where: { id: storeId },
      data: {
        isPublished: true,
        latitude: 40.7128,
        longitude: -74.006,
      },
    })
  })

  afterAll(async () => {
    // Final cleanup
    await prisma.comment.deleteMany({ where: { user: { email: { contains: '@river-test.com' } } } })
    await prisma.postLike.deleteMany({ where: { user: { email: { contains: '@river-test.com' } } } })
    await prisma.post.deleteMany({ where: { store: { slug: { contains: 'river-test' } } } })
    await prisma.store.deleteMany({ where: { slug: { contains: 'river-test' } } })
    await prisma.user.deleteMany({ where: { email: { contains: '@river-test.com' } } })
    await app.close()
  })

  // ========================================
  // POST ROUTES
  // ========================================

  describe('POST /river/posts - Create Post', () => {
    it('should create post with text content', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/river/posts',
        headers: {
          authorization: `Bearer ${user1Token}`,
        },
        payload: {
          storeId,
          content: 'Hello world! This is my first post.',
          mediaUrls: [], // Include empty array for mediaUrls
        },
      })

      // Log error for debugging
      if (response.statusCode !== 201) {
        console.log('Create post error:', JSON.parse(response.body))
      }

      expect(response.statusCode).toBe(201)
      const post = JSON.parse(response.body)
      expect(post.id).toBeDefined()
      expect(post.storeId).toBe(storeId)
      expect(post.content).toBe('Hello world! This is my first post.')
      
      postId = post.id // Save for other tests
    })

    it('should create post with media URLs', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/river/posts',
        headers: {
          authorization: `Bearer ${user1Token}`,
        },
        payload: {
          storeId,
          content: 'Check out this video!',
          mediaUrls: [
            {
              type: 'youtube',
              url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg',
            },
          ],
        },
      })

      expect(response.statusCode).toBe(201)
      const post = JSON.parse(response.body)
      expect(post.mediaUrls).toBeDefined()
      expect(Array.isArray(post.mediaUrls)).toBe(true)
    })

    it('should reject post without authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/river/posts',
        payload: {
          storeId,
          content: 'This should fail',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should reject post without storeId', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/river/posts',
        headers: {
          authorization: `Bearer ${user1Token}`,
        },
        payload: {
          content: 'Missing storeId',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('rejects AUTO_PRODUCT without media (409)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/river/posts',
        headers: {
          authorization: `Bearer ${user1Token}`,
        },
        payload: {
          storeId,
          content: 'no media',
          mediaUrls: [],
          source: 'AUTO_PRODUCT',
        },
      })
      expect(response.statusCode).toBe(409)
      const body = JSON.parse(response.body)
      expect(body.code).toBe('AUTO_MISSING_MEDIA')
    })

    it('enforces AUTO_PRODUCT cooldown per store (409)', async () => {
      const media = [{ type: 'image', url: 'https://example.com/cooldown-a.jpg' }]
      const first = await app.inject({
        method: 'POST',
        url: '/river/posts',
        headers: { authorization: `Bearer ${user1Token}` },
        payload: {
          storeId,
          content: 'first auto product',
          mediaUrls: media,
          source: 'AUTO_PRODUCT',
        },
      })
      expect(first.statusCode).toBe(201)

      const second = await app.inject({
        method: 'POST',
        url: '/river/posts',
        headers: { authorization: `Bearer ${user1Token}` },
        payload: {
          storeId,
          content: 'second auto product',
          mediaUrls: media,
          source: 'AUTO_PRODUCT',
        },
      })
      expect(second.statusCode).toBe(409)
      expect(JSON.parse(second.body).code).toBe('AUTO_PRODUCT_COOLDOWN')
    })
  })

  describe('GET /river/feed', () => {
    const feedMedia = [{ type: 'image' as const, url: 'https://example.com/feed-seed.jpg' }]

    beforeEach(async () => {
      for (let i = 0; i < 3; i++) {
        await app.inject({
          method: 'POST',
          url: '/river/posts',
          headers: { authorization: `Bearer ${user1Token}` },
          payload: {
            storeId,
            content: `feed seed ${i}`,
            mediaUrls: feedMedia,
          },
        })
      }
    })

    it('returns RiverFeedPage shape and paginates with cursor', async () => {
      const first = await app.inject({ method: 'GET', url: '/river/feed?limit=2' })
      expect(first.statusCode).toBe(200)
      const body = JSON.parse(first.body)
      expect(Array.isArray(body.items)).toBe(true)
      expect(body.items.length).toBe(2)
      expect(body.items[0]).toMatchObject({
        priority: expect.any(Number),
        layout: expect.any(String),
        actor: { kind: 'store', displayName: expect.any(String) },
      })
      expect(body.nextCursor).toBeTruthy()

      const second = await app.inject({
        method: 'GET',
        url: `/river/feed?limit=2&cursor=${encodeURIComponent(body.nextCursor)}`,
      })
      expect(second.statusCode).toBe(200)
      const page2 = JSON.parse(second.body)
      expect(page2.items.length).toBeGreaterThanOrEqual(1)
    })

    it('scopes by lat/lng + radius (includes NYC store)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/river/feed?lat=40.713&lng=-74.006&radiusMiles=10&limit=10',
      })
      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body).items.length).toBeGreaterThan(0)
    })

    it('returns no items when radius excludes store', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/river/feed?lat=34.05&lng=-118.25&radiusMiles=5&limit=20',
      })
      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body).items.length).toBe(0)
    })

    it('returns 400 when lat is set without lng', async () => {
      const res = await app.inject({ method: 'GET', url: '/river/feed?lat=40.71' })
      expect(res.statusCode).toBe(400)
    })

    it('returns 400 for invalid cursor', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/river/feed?cursor=%%%invalid%%%',
      })
      expect(res.statusCode).toBe(400)
    })
  })

  describe('PATCH /river/posts/:id — priority', () => {
    it('updates post priority', async () => {
      const created = await app.inject({
        method: 'POST',
        url: '/river/posts',
        headers: { authorization: `Bearer ${user1Token}` },
        payload: {
          storeId,
          content: 'priority target',
          mediaUrls: [{ type: 'image', url: 'https://example.com/pr.jpg' }],
        },
      })
      expect(created.statusCode).toBe(201)
      const id = JSON.parse(created.body).id

      const patch = await app.inject({
        method: 'PATCH',
        url: `/river/posts/${id}`,
        headers: { authorization: `Bearer ${user1Token}` },
        payload: { priority: 42 },
      })
      expect(patch.statusCode).toBe(200)
      expect(JSON.parse(patch.body).priority).toBe(42)
    })
  })

  describe('GET /river/posts - List Posts', () => {
    beforeEach(async () => {
      // Create test posts
      const post1 = await app.inject({
        method: 'POST',
        url: '/river/posts',
        headers: { authorization: `Bearer ${user1Token}` },
        payload: {
          storeId,
          content: 'First post',
          mediaUrls: defaultRiverMedia,
        },
      })
      postId = JSON.parse(post1.body).id

      await app.inject({
        method: 'POST',
        url: '/river/posts',
        headers: { authorization: `Bearer ${user1Token}` },
        payload: {
          storeId,
          content: 'Second post',
          mediaUrls: defaultRiverMedia,
        },
      })
    })

    it('should list all posts without authentication (public)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/river/posts',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toBeDefined()
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.data.length).toBeGreaterThanOrEqual(2)
      expect(body.total).toBeGreaterThanOrEqual(2)
    })

    it('should filter posts by storeId', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/river/posts?storeId=${storeId}`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.length).toBeGreaterThanOrEqual(2)
      body.data.forEach((post: any) => {
        expect(post.storeId).toBe(storeId)
      })
    })

    it('should support sortBy parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/river/posts?sortBy=recent',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toBeDefined()
    })

    it('should support pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/river/posts?page=1&pageSize=1',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.page).toBe(1)
      expect(body.pageSize).toBe(1)
      expect(body.data.length).toBeLessThanOrEqual(1)
    })
  })

  describe('GET /river/posts/:id - Get Single Post', () => {
    beforeEach(async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/river/posts',
        headers: { authorization: `Bearer ${user1Token}` },
        payload: {
          storeId,
          content: 'Test post for retrieval',
          mediaUrls: defaultRiverMedia,
        },
      })
      postId = JSON.parse(response.body).id
    })

    it('should get post by id without authentication (public)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/river/posts/${postId}`,
      })

      expect(response.statusCode).toBe(200)
      const post = JSON.parse(response.body)
      expect(post.id).toBe(postId)
      expect(post.storeId).toBe(storeId)
      expect(post.storeName).toBeDefined()
    })

    it('should return 404 for non-existent post', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/river/posts/00000000-0000-0000-0000-000000000000',
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('DELETE /river/posts/:id - Delete Post', () => {
    beforeEach(async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/river/posts',
        headers: { authorization: `Bearer ${user1Token}` },
        payload: {
          storeId,
          content: 'Post to be deleted',
          mediaUrls: defaultRiverMedia,
        },
      })
      postId = JSON.parse(response.body).id
    })

    it('should delete own post', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/river/posts/${postId}`,
        headers: {
          authorization: `Bearer ${user1Token}`,
        },
      })

      expect(response.statusCode).toBe(204)

      // Verify post is deleted
      const getResponse = await app.inject({
        method: 'GET',
        url: `/river/posts/${postId}`,
      })
      expect(getResponse.statusCode).toBe(404)
    })

    it('should reject delete without authentication', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/river/posts/${postId}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })

  // ========================================
  // LIKE ROUTES
  // ========================================

  describe('POST /river/posts/:id/like - Like Post', () => {
    beforeEach(async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/river/posts',
        headers: { authorization: `Bearer ${user1Token}` },
        payload: {
          storeId,
          content: 'Post to be liked',
          mediaUrls: defaultRiverMedia,
        },
      })
      postId = JSON.parse(response.body).id
    })

    it('should like a post', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/river/posts/${postId}/like`,
        headers: {
          authorization: `Bearer ${user2Token}`,
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
    })

    it('should reject duplicate like', async () => {
      // Like once
      await app.inject({
        method: 'POST',
        url: `/river/posts/${postId}/like`,
        headers: { authorization: `Bearer ${user2Token}` },
      })

      // Try to like again
      const response = await app.inject({
        method: 'POST',
        url: `/river/posts/${postId}/like`,
        headers: { authorization: `Bearer ${user2Token}` },
      })

      expect(response.statusCode).toBe(409)
      const body = JSON.parse(response.body)
      expect(body.error).toContain('already liked')
    })

    it('should reject like without authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/river/posts/${postId}/like`,
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('DELETE /river/posts/:id/like - Unlike Post', () => {
    beforeEach(async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/river/posts',
        headers: { authorization: `Bearer ${user1Token}` },
        payload: {
          storeId,
          content: 'Post to unlike',
          mediaUrls: defaultRiverMedia,
        },
      })
      postId = JSON.parse(response.body).id

      // Like the post first
      await app.inject({
        method: 'POST',
        url: `/river/posts/${postId}/like`,
        headers: { authorization: `Bearer ${user2Token}` },
      })
    })

    it('should unlike a liked post', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/river/posts/${postId}/like`,
        headers: {
          authorization: `Bearer ${user2Token}`,
        },
      })

      expect(response.statusCode).toBe(204)
    })

    it('should reject unlike without authentication', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/river/posts/${postId}/like`,
      })

      expect(response.statusCode).toBe(401)
    })
  })

  // ========================================
  // COMMENT ROUTES
  // ========================================

  describe('POST /river/posts/:id/comments - Create Comment', () => {
    beforeEach(async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/river/posts',
        headers: { authorization: `Bearer ${user1Token}` },
        payload: {
          storeId,
          content: 'Post for comments',
          mediaUrls: defaultRiverMedia,
        },
      })
      postId = JSON.parse(response.body).id
    })

    it('should create comment on post', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/river/posts/${postId}/comments`,
        headers: {
          authorization: `Bearer ${user2Token}`,
        },
        payload: {
          content: 'Great post!',
        },
      })

      expect(response.statusCode).toBe(201)
      const comment = JSON.parse(response.body)
      expect(comment.id).toBeDefined()
      expect(comment.postId).toBe(postId)
      expect(comment.content).toBe('Great post!')
    })

    it('should reject comment without authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/river/posts/${postId}/comments`,
        payload: {
          content: 'This should fail',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should reject empty comment', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/river/posts/${postId}/comments`,
        headers: {
          authorization: `Bearer ${user2Token}`,
        },
        payload: {
          content: '',
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /river/posts/:id/comments - List Comments', () => {
    let commentId: string

    beforeEach(async () => {
      // Create post
      const postResponse = await app.inject({
        method: 'POST',
        url: '/river/posts',
        headers: { authorization: `Bearer ${user1Token}` },
        payload: {
          storeId,
          content: 'Post with comments',
          mediaUrls: defaultRiverMedia,
        },
      })
      postId = JSON.parse(postResponse.body).id

      // Create comments
      const comment1 = await app.inject({
        method: 'POST',
        url: `/river/posts/${postId}/comments`,
        headers: { authorization: `Bearer ${user1Token}` },
        payload: { content: 'First comment' },
      })
      commentId = JSON.parse(comment1.body).id

      await app.inject({
        method: 'POST',
        url: `/river/posts/${postId}/comments`,
        headers: { authorization: `Bearer ${user2Token}` },
        payload: { content: 'Second comment' },
      })
    })

    it('should list comments without authentication (public)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/river/posts/${postId}/comments`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toBeDefined()
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.data.length).toBe(2)
      expect(body.total).toBe(2)
    })

    it('should support pagination for comments', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/river/posts/${postId}/comments?page=1&pageSize=1`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.page).toBe(1)
      expect(body.pageSize).toBe(1)
      expect(body.data.length).toBe(1)
    })
  })

  describe('DELETE /river/comments/:id - Delete Comment', () => {
    let commentId: string

    beforeEach(async () => {
      // Create post
      const postResponse = await app.inject({
        method: 'POST',
        url: '/river/posts',
        headers: { authorization: `Bearer ${user1Token}` },
        payload: {
          storeId,
          content: 'Post for comment deletion',
          mediaUrls: defaultRiverMedia,
        },
      })
      postId = JSON.parse(postResponse.body).id

      // Create comment
      const commentResponse = await app.inject({
        method: 'POST',
        url: `/river/posts/${postId}/comments`,
        headers: { authorization: `Bearer ${user1Token}` },
        payload: { content: 'Comment to delete' },
      })
      commentId = JSON.parse(commentResponse.body).id
    })

    it('should delete own comment', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/river/comments/${commentId}`,
        headers: {
          authorization: `Bearer ${user1Token}`,
        },
      })

      expect(response.statusCode).toBe(204)
    })

    it('should reject delete without authentication', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/river/comments/${commentId}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })

  // ========================================
  // INTEGRATION TESTS - Full Workflows
  // ========================================

  describe('Full River Workflow', () => {
    it('should complete full post lifecycle: create → like → comment → unlike → delete', async () => {
      // 1. Create post
      const createResponse = await app.inject({
        method: 'POST',
        url: '/river/posts',
        headers: { authorization: `Bearer ${user1Token}` },
        payload: {
          storeId,
          content: 'Lifecycle test post',
          mediaUrls: defaultRiverMedia,
        },
      })
      expect(createResponse.statusCode).toBe(201)
      const post = JSON.parse(createResponse.body)
      const testPostId = post.id

      // 2. Another user likes the post
      const likeResponse = await app.inject({
        method: 'POST',
        url: `/river/posts/${testPostId}/like`,
        headers: { authorization: `Bearer ${user2Token}` },
      })
      expect(likeResponse.statusCode).toBe(201)

      // 3. Another user comments on the post
      const commentResponse = await app.inject({
        method: 'POST',
        url: `/river/posts/${testPostId}/comments`,
        headers: { authorization: `Bearer ${user2Token}` },
        payload: { content: 'Nice post!' },
      })
      expect(commentResponse.statusCode).toBe(201)

      // 4. Get post and verify engagement
      const getResponse = await app.inject({
        method: 'GET',
        url: `/river/posts/${testPostId}`,
      })
      expect(getResponse.statusCode).toBe(200)
      const updatedPost = JSON.parse(getResponse.body)
      expect(updatedPost.likesCount).toBeGreaterThanOrEqual(1)
      expect(updatedPost.commentsCount).toBeGreaterThanOrEqual(1)

      // 5. User unlikes the post
      const unlikeResponse = await app.inject({
        method: 'DELETE',
        url: `/river/posts/${testPostId}/like`,
        headers: { authorization: `Bearer ${user2Token}` },
      })
      expect(unlikeResponse.statusCode).toBe(204)

      // 6. Delete the post
      const deleteResponse = await app.inject({
        method: 'DELETE',
        url: `/river/posts/${testPostId}`,
        headers: { authorization: `Bearer ${user1Token}` },
      })
      expect(deleteResponse.statusCode).toBe(204)

      // 7. Verify post is gone
      const finalCheck = await app.inject({
        method: 'GET',
        url: `/river/posts/${testPostId}`,
      })
      expect(finalCheck.statusCode).toBe(404)
    })
  })
})

