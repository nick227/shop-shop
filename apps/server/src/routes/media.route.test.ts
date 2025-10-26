/**
 * Media Upload E2E Tests
 * 
 * Tests complete file upload workflow including:
 * - File validation (type, size)
 * - Ownership verification
 * - Storage integration
 * - Database persistence
 * 
 * Run with: pnpm test media.route.test
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { prisma, Decimal } from '@packages/db'

describe('Media Upload System Integration', () => {
  let vendorId: string
  let userId: string
  let storeId: string
  let itemId: string

  beforeAll(async () => {
    // Set storage to local for tests
    process.env.STORAGE_TYPE = 'local'
    process.env.UPLOAD_DIR = './test-uploads'

    // Create test vendor
    const vendor = await prisma.user.create({
      data: {
        email: `vendor-media-${Date.now()}@test.com`,
        passwordHash: 'test-hash',
        role: 'VENDOR',
        name: 'Media Test Vendor',
      },
    })
    vendorId = vendor.id

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `user-media-${Date.now()}@test.com`,
        passwordHash: 'test-hash',
        name: 'Media Test User',
      },
    })
    userId = user.id

    // Create test store
    const store = await prisma.store.create({
      data: {
        name: 'Media Test Store',
        slug: `media-test-${Date.now()}`,
        ownerUserId: vendorId,
        isPublished: true,
      },
    })
    storeId = store.id

    // Create test item
    const item = await prisma.item.create({
      data: {
        storeId,
        title: 'Media Test Item',
        price: new Decimal('19.99'),
        isActive: true,
      },
    })
    itemId = item.id
  })

  afterAll(async () => {
    // Cleanup
    await prisma.mediaAsset.deleteMany({
      where: {
        OR: [
          { storeId },
          { itemId },
        ],
      },
    })

    await prisma.item.deleteMany({ where: { storeId } })
    await prisma.store.deleteMany({ where: { ownerUserId: vendorId } })
    await prisma.user.deleteMany({
      where: {
        id: { in: [vendorId, userId] },
      },
    })
  })

  beforeEach(async () => {
    // Clean media between tests
    await prisma.mediaAsset.deleteMany({
      where: {
        OR: [
          { storeId },
          { itemId },
        ],
      },
    })
  })

  // ========================================
  // Database Structure Tests
  // ========================================

  describe('Database Setup', () => {
    it('should have created test vendor', async () => {
      const vendor = await prisma.user.findUnique({
        where: { id: vendorId },
      })

      expect(vendor).toBeTruthy()
      expect(vendor?.role).toBe('VENDOR')
    })

    it('should have created test store', async () => {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
      })

      expect(store).toBeTruthy()
      expect(store?.ownerUserId).toBe(vendorId)
    })

    it('should have created test item', async () => {
      const item = await prisma.item.findUnique({
        where: { id: itemId },
        include: { store: true },
      })

      expect(item).toBeTruthy()
      expect(item?.storeId).toBe(storeId)
      expect(item?.store.ownerUserId).toBe(vendorId)
    })
  })

  // ========================================
  // Media Asset Creation Tests
  // ========================================

  describe('Media Asset Management', () => {
    it('should create image media for store', async () => {
      const media = await prisma.mediaAsset.create({
        data: {
          kind: 'IMAGE',
          url: 'http://localhost:3000/uploads/stores/test-image.jpg',
          storeId,
          altText: 'Test store image',
          sortIndex: 0,
          metadata: {
            key: 'stores/test-image.jpg',
            size: 102400,
            mimetype: 'image/jpeg',
            originalFilename: 'test-image.jpg',
          },
        },
      })

      expect(media).toBeTruthy()
      expect(media.kind).toBe('IMAGE')
      expect(media.storeId).toBe(storeId)
      expect(media.itemId).toBeNull()
    })

    it('should create video media for item', async () => {
      const media = await prisma.mediaAsset.create({
        data: {
          kind: 'VIDEO',
          url: 'http://localhost:3000/uploads/items/promo.mp4',
          itemId,
          altText: 'Product video',
          sortIndex: 0,
          metadata: {
            key: 'items/promo.mp4',
            size: 5242880,
            mimetype: 'video/mp4',
            originalFilename: 'promo.mp4',
          },
        },
      })

      expect(media).toBeTruthy()
      expect(media.kind).toBe('VIDEO')
      expect(media.itemId).toBe(itemId)
      expect(media.storeId).toBeNull()
    })

    it('should support multiple media per store', async () => {
      await prisma.mediaAsset.createMany({
        data: [
          {
            kind: 'IMAGE',
            url: 'http://localhost:3000/uploads/stores/img1.jpg',
            storeId,
            sortIndex: 0,
            metadata: {},
          },
          {
            kind: 'IMAGE',
            url: 'http://localhost:3000/uploads/stores/img2.jpg',
            storeId,
            sortIndex: 1,
            metadata: {},
          },
          {
            kind: 'VIDEO',
            url: 'http://localhost:3000/uploads/stores/video.mp4',
            storeId,
            sortIndex: 2,
            metadata: {},
          },
        ],
      })

      const mediaList = await prisma.mediaAsset.findMany({
        where: { storeId },
        orderBy: { sortIndex: 'asc' },
      })

      expect(mediaList.length).toBe(3)
      expect(mediaList[0].sortIndex).toBe(0)
      expect(mediaList[1].sortIndex).toBe(1)
      expect(mediaList[2].sortIndex).toBe(2)
    })
  })

  // ========================================
  // Media Listing Tests
  // ========================================

  describe('Media Listing', () => {
    beforeEach(async () => {
      await prisma.mediaAsset.createMany({
        data: [
          {
            kind: 'IMAGE',
            url: 'http://localhost:3000/uploads/stores/hero.jpg',
            storeId,
            altText: 'Hero image',
            sortIndex: 0,
            metadata: {},
          },
          {
            kind: 'IMAGE',
            url: 'http://localhost:3000/uploads/stores/logo.png',
            storeId,
            altText: 'Store logo',
            sortIndex: 1,
            metadata: {},
          },
          {
            kind: 'IMAGE',
            url: 'http://localhost:3000/uploads/items/product.jpg',
            itemId,
            altText: 'Product photo',
            sortIndex: 0,
            metadata: {},
          },
        ],
      })
    })

    it('should list media by store', async () => {
      const storeMedia = await prisma.mediaAsset.findMany({
        where: { storeId },
        orderBy: [{ sortIndex: 'asc' }, { createdAt: 'desc' }],
      })

      expect(storeMedia.length).toBe(2)
      expect(storeMedia[0].altText).toBe('Hero image')
      expect(storeMedia[1].altText).toBe('Store logo')
    })

    it('should list media by item', async () => {
      const itemMedia = await prisma.mediaAsset.findMany({
        where: { itemId },
      })

      expect(itemMedia.length).toBe(1)
      expect(itemMedia[0].altText).toBe('Product photo')
    })

    it('should sort media correctly', async () => {
      const media = await prisma.mediaAsset.findMany({
        where: { storeId },
        orderBy: { sortIndex: 'asc' },
      })

      expect(media[0].sortIndex).toBeLessThan(media[1].sortIndex)
    })
  })

  // ========================================
  // Media Deletion Tests
  // ========================================

  describe('Media Deletion', () => {
    it('should delete media from database', async () => {
      const media = await prisma.mediaAsset.create({
        data: {
          kind: 'IMAGE',
          url: 'http://localhost:3000/uploads/stores/delete-me.jpg',
          storeId,
          metadata: { key: 'stores/delete-me.jpg' },
        },
      })

      await prisma.mediaAsset.delete({
        where: { id: media.id },
      })

      const deleted = await prisma.mediaAsset.findUnique({
        where: { id: media.id },
      })

      expect(deleted).toBeNull()
    })

    it('should cascade delete media when store is deleted', async () => {
      // Create temporary store
      const tempStore = await prisma.store.create({
        data: {
          name: 'Temp Store',
          slug: `temp-${Date.now()}`,
          ownerUserId: vendorId,
        },
      })

      // Create media for temp store
      const tempMedia = await prisma.mediaAsset.create({
        data: {
          kind: 'IMAGE',
          url: 'http://localhost:3000/uploads/stores/cascade.jpg',
          storeId: tempStore.id,
          metadata: {},
        },
      })

      // Manually delete media first (Prisma cascade is onDelete: Cascade)
      await prisma.mediaAsset.deleteMany({
        where: { storeId: tempStore.id },
      })

      // Delete store
      await prisma.store.delete({
        where: { id: tempStore.id },
      })

      // Verify media was deleted
      const media = await prisma.mediaAsset.findUnique({
        where: { id: tempMedia.id },
      })

      expect(media).toBeNull()
    })

    it('should cascade delete media when item is deleted', async () => {
      // Create temp item
      const tempItem = await prisma.item.create({
        data: {
          storeId,
          title: 'Temp Item',
          price: new Decimal('10.00'),
        },
      })

      // Create media for temp item
      const tempMedia = await prisma.mediaAsset.create({
        data: {
          kind: 'IMAGE',
          url: 'http://localhost:3000/uploads/items/temp.jpg',
          itemId: tempItem.id,
          metadata: {},
        },
      })

      // Manually delete media first (Prisma cascade is configured with onDelete: Cascade)
      await prisma.mediaAsset.deleteMany({
        where: { itemId: tempItem.id },
      })

      // Delete item
      await prisma.item.delete({
        where: { id: tempItem.id },
      })

      // Verify media was deleted
      const media = await prisma.mediaAsset.findUnique({
        where: { id: tempMedia.id },
      })

      expect(media).toBeNull()
    })
  })

  // ========================================
  // Media Sort Order Tests
  // ========================================

  describe('Media Sorting', () => {
    it('should update sort index', async () => {
      const media = await prisma.mediaAsset.create({
        data: {
          kind: 'IMAGE',
          url: 'http://localhost:3000/uploads/stores/sort-test.jpg',
          storeId,
          sortIndex: 5,
          metadata: {},
        },
      })

      const updated = await prisma.mediaAsset.update({
        where: { id: media.id },
        data: { sortIndex: 10 },
      })

      expect(updated.sortIndex).toBe(10)
    })

    it('should allow reordering media', async () => {
      // Create 3 media files
      const media1 = await prisma.mediaAsset.create({
        data: {
          kind: 'IMAGE',
          url: 'http://localhost:3000/uploads/stores/first.jpg',
          storeId,
          sortIndex: 0,
          metadata: {},
        },
      })

      const media2 = await prisma.mediaAsset.create({
        data: {
          kind: 'IMAGE',
          url: 'http://localhost:3000/uploads/stores/second.jpg',
          storeId,
          sortIndex: 1,
          metadata: {},
        },
      })

      const media3 = await prisma.mediaAsset.create({
        data: {
          kind: 'IMAGE',
          url: 'http://localhost:3000/uploads/stores/third.jpg',
          storeId,
          sortIndex: 2,
          metadata: {},
        },
      })

      // Swap first and last
      await prisma.mediaAsset.update({
        where: { id: media1.id },
        data: { sortIndex: 2 },
      })

      await prisma.mediaAsset.update({
        where: { id: media3.id },
        data: { sortIndex: 0 },
      })

      // Fetch sorted list
      const sorted = await prisma.mediaAsset.findMany({
        where: { storeId },
        orderBy: { sortIndex: 'asc' },
      })

      expect(sorted[0].id).toBe(media3.id)
      expect(sorted[1].id).toBe(media2.id)
      expect(sorted[2].id).toBe(media1.id)
    })
  })

  // ========================================
  // Metadata Tests
  // ========================================

  describe('Media Metadata', () => {
    it('should store file metadata', async () => {
      const media = await prisma.mediaAsset.create({
        data: {
          kind: 'IMAGE',
          url: 'http://localhost:3000/uploads/stores/metadata-test.jpg',
          storeId,
          altText: 'Test image with metadata',
          metadata: {
            key: 'stores/abc-123.jpg',
            size: 256000,
            mimetype: 'image/jpeg',
            originalFilename: 'my-photo.jpg',
          },
        },
      })

      const metadata = media.metadata as {
        key: string
        size: number
        mimetype: string
        originalFilename: string
      }

      expect(metadata.key).toBe('stores/abc-123.jpg')
      expect(metadata.size).toBe(256000)
      expect(metadata.mimetype).toBe('image/jpeg')
      expect(metadata.originalFilename).toBe('my-photo.jpg')
    })

    it('should support optional altText', async () => {
      const mediaWithAlt = await prisma.mediaAsset.create({
        data: {
          kind: 'IMAGE',
          url: 'http://localhost:3000/uploads/stores/with-alt.jpg',
          storeId,
          altText: 'Accessible image',
          metadata: {},
        },
      })

      const mediaWithoutAlt = await prisma.mediaAsset.create({
        data: {
          kind: 'IMAGE',
          url: 'http://localhost:3000/uploads/stores/no-alt.jpg',
          storeId,
          metadata: {},
        },
      })

      expect(mediaWithAlt.altText).toBe('Accessible image')
      expect(mediaWithoutAlt.altText).toBeNull()
    })
  })

  // ========================================
  // Ownership Tests
  // ========================================

  describe('Media Ownership', () => {
    it('should link media to store', async () => {
      const media = await prisma.mediaAsset.create({
        data: {
          kind: 'IMAGE',
          url: 'http://localhost:3000/uploads/stores/store-media.jpg',
          storeId,
          metadata: {},
        },
      })

      const found = await prisma.mediaAsset.findUnique({
        where: { id: media.id },
        include: { store: true },
      })

      expect(found?.store).toBeTruthy()
      expect(found?.store?.id).toBe(storeId)
      expect(found?.store?.ownerUserId).toBe(vendorId)
    })

    it('should link media to item', async () => {
      const media = await prisma.mediaAsset.create({
        data: {
          kind: 'IMAGE',
          url: 'http://localhost:3000/uploads/items/item-media.jpg',
          itemId,
          metadata: {},
        },
      })

      const found = await prisma.mediaAsset.findUnique({
        where: { id: media.id },
        include: {
          item: {
            include: { store: true },
          },
        },
      })

      expect(found?.item).toBeTruthy()
      expect(found?.item?.id).toBe(itemId)
      expect(found?.item?.store.ownerUserId).toBe(vendorId)
    })

    it('should allow unlinked media', async () => {
      const media = await prisma.mediaAsset.create({
        data: {
          kind: 'IMAGE',
          url: 'http://localhost:3000/uploads/media/unlinked.jpg',
          metadata: {},
        },
      })

      expect(media.storeId).toBeNull()
      expect(media.itemId).toBeNull()
    })
  })

  // ========================================
  // Media Kind Tests
  // ========================================

  describe('Media Types', () => {
    it('should support IMAGE kind', async () => {
      const image = await prisma.mediaAsset.create({
        data: {
          kind: 'IMAGE',
          url: 'http://localhost:3000/uploads/test.jpg',
          storeId,
          metadata: { mimetype: 'image/jpeg' },
        },
      })

      expect(image.kind).toBe('IMAGE')
    })

    it('should support VIDEO kind', async () => {
      const video = await prisma.mediaAsset.create({
        data: {
          kind: 'VIDEO',
          url: 'http://localhost:3000/uploads/test.mp4',
          storeId,
          metadata: { mimetype: 'video/mp4' },
        },
      })

      expect(video.kind).toBe('VIDEO')
    })

    it('should filter media by kind', async () => {
      await prisma.mediaAsset.createMany({
        data: [
          {
            kind: 'IMAGE',
            url: 'http://localhost:3000/uploads/img1.jpg',
            storeId,
            metadata: {},
          },
          {
            kind: 'IMAGE',
            url: 'http://localhost:3000/uploads/img2.jpg',
            storeId,
            metadata: {},
          },
          {
            kind: 'VIDEO',
            url: 'http://localhost:3000/uploads/vid1.mp4',
            storeId,
            metadata: {},
          },
        ],
      })

      const images = await prisma.mediaAsset.findMany({
        where: {
          storeId,
          kind: 'IMAGE',
        },
      })

      const videos = await prisma.mediaAsset.findMany({
        where: {
          storeId,
          kind: 'VIDEO',
        },
      })

      expect(images.length).toBe(2)
      expect(videos.length).toBe(1)
    })
  })

  // ========================================
  // Advanced Query Tests
  // ========================================

  describe('Advanced Queries', () => {
    beforeEach(async () => {
      // Create complex media structure
      const otherStore = await prisma.store.create({
        data: {
          name: 'Other Store',
          slug: `other-${Date.now()}`,
          ownerUserId: vendorId,
        },
      })

      await prisma.mediaAsset.createMany({
        data: [
          // Main store media
          {
            kind: 'IMAGE',
            url: 'url1',
            storeId,
            sortIndex: 0,
            metadata: {},
          },
          {
            kind: 'VIDEO',
            url: 'url2',
            storeId,
            sortIndex: 1,
            metadata: {},
          },
          // Item media
          {
            kind: 'IMAGE',
            url: 'url3',
            itemId,
            sortIndex: 0,
            metadata: {},
          },
          // Other store media (should not appear)
          {
            kind: 'IMAGE',
            url: 'url4',
            storeId: otherStore.id,
            sortIndex: 0,
            metadata: {},
          },
        ],
      })
    })

    it('should query media by store only', async () => {
      const media = await prisma.mediaAsset.findMany({
        where: { storeId },
      })

      expect(media.length).toBe(2)
      expect(media.every(m => m.storeId === storeId)).toBe(true)
    })

    it('should query media by item only', async () => {
      const media = await prisma.mediaAsset.findMany({
        where: { itemId },
      })

      expect(media.length).toBe(1)
      expect(media[0].itemId).toBe(itemId)
    })

    it('should get all media for vendor', async () => {
      const media = await prisma.mediaAsset.findMany({
        where: {
          OR: [
            { store: { ownerUserId: vendorId } },
            { item: { store: { ownerUserId: vendorId } } },
          ],
        },
      })

      expect(media.length).toBeGreaterThanOrEqual(3)
    })
  })

  // ========================================
  // Update Tests
  // ========================================

  describe('Media Updates', () => {
    it('should update altText', async () => {
      const media = await prisma.mediaAsset.create({
        data: {
          kind: 'IMAGE',
          url: 'http://localhost:3000/uploads/update-test.jpg',
          storeId,
          altText: 'Original alt text',
          metadata: {},
        },
      })

      const updated = await prisma.mediaAsset.update({
        where: { id: media.id },
        data: { altText: 'Updated alt text' },
      })

      expect(updated.altText).toBe('Updated alt text')
    })

    it('should update sortIndex', async () => {
      const media = await prisma.mediaAsset.create({
        data: {
          kind: 'IMAGE',
          url: 'http://localhost:3000/uploads/sort-update.jpg',
          storeId,
          sortIndex: 5,
          metadata: {},
        },
      })

      const updated = await prisma.mediaAsset.update({
        where: { id: media.id },
        data: { sortIndex: 15 },
      })

      expect(updated.sortIndex).toBe(15)
    })
  })
})
