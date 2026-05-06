import { prisma } from '../client.js'
import { getStorageAdapter, validateMediaFile, type UploadFile } from '../adapters/storage.adapter.js'

// ========================================
// Media Service
// Business logic for media uploads
// ========================================

export interface UploadMediaInput {
  file: UploadFile
  storeId?: string
  itemId?: string
  userId: string
  altText?: string
  sortIndex?: number
}

export interface UploadMediaResult {
  id: string
  kind: 'IMAGE' | 'VIDEO'
  url: string
  altText: string | null
  sortIndex: number
  size: number
}

export const uploadMedia = async (input: UploadMediaInput): Promise<UploadMediaResult> => {
  // Validate file
  const validation = validateMediaFile(input.file.mimetype, input.file.size)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Determine media kind
  const kind = input.file.mimetype.startsWith('image/') ? 'IMAGE' : 'VIDEO'

  // Set folder based on context
  const folder = input.storeId ? 'stores' : input.itemId ? 'items' : 'media'
  input.file.folder = folder

  // Verify ownership and check limits
  if (input.storeId) {
    const store = await prisma.store.findUnique({
      where: { id: input.storeId },
    })

    if (!store) {
      throw new Error('Store not found')
    }

    if (store.ownerUserId !== input.userId) {
      throw new Error('Unauthorized: Store does not belong to user')
    }

    // Check store media limit
    const existingStoreMedia = await prisma.mediaAsset.count({
      where: { storeId: input.storeId }
    })

    if (existingStoreMedia >= 100) {
      throw new Error('Store media limit reached (100 maximum)')
    }
  }

  if (input.itemId) {
    const item = await prisma.item.findUnique({
      where: { id: input.itemId },
      include: { store: true },
    })

    if (!item) {
      throw new Error('Item not found')
    }

    if (item.store.ownerUserId !== input.userId) {
      throw new Error('Unauthorized: Item does not belong to user')
    }

    // Check product media limit
    const existingItemMedia = await prisma.mediaAsset.count({
      where: { itemId: input.itemId }
    })

    if (existingItemMedia >= 100) {
      throw new Error('Product media limit reached (100 maximum)')
    }
  }

  // Determine sort index - append to end if not specified
  let sortIndex = input.sortIndex || 0
  if (!input.sortIndex) {
    if (input.storeId) {
      const maxSortIndex = await prisma.mediaAsset.findFirst({
        where: { storeId: input.storeId },
        orderBy: { sortIndex: 'desc' }
      })
      sortIndex = (maxSortIndex?.sortIndex || -1) + 1
    } else if (input.itemId) {
      const maxSortIndex = await prisma.mediaAsset.findFirst({
        where: { itemId: input.itemId },
        orderBy: { sortIndex: 'desc' }
      })
      sortIndex = (maxSortIndex?.sortIndex || -1) + 1
    }
  }

  // Upload to storage
  const storage = getStorageAdapter()
  const uploadResult = await storage.upload(input.file)

  // Save to database
  const mediaAsset = await prisma.mediaAsset.create({
    data: {
      kind,
      url: uploadResult.url,
      altText: input.altText || null,
      sortIndex,
      metadata: {
        key: uploadResult.key,
        size: uploadResult.size,
        mimetype: uploadResult.mimetype,
        originalFilename: input.file.filename,
      },
      storeId: input.storeId || null,
      itemId: input.itemId || null,
    },
  })

  return {
    id: mediaAsset.id,
    kind: mediaAsset.kind,
    url: mediaAsset.url,
    altText: mediaAsset.altText,
    sortIndex: mediaAsset.sortIndex,
    size: uploadResult.size,
  }
}

export interface DeleteMediaInput {
  mediaId: string
  userId: string
}

export const deleteMedia = async (input: DeleteMediaInput): Promise<void> => {
  const media = await prisma.mediaAsset.findUnique({
    where: { id: input.mediaId },
    include: {
      store: true,
      item: {
        include: { store: true },
      },
    },
  })

  if (!media) {
    throw new Error('Media not found')
  }

  // Verify ownership
  const ownerId = media.store?.ownerUserId || media.item?.store.ownerUserId

  if (!ownerId || ownerId !== input.userId) {
    throw new Error('Unauthorized: You do not own this media')
  }

  // Delete from storage
  try {
    const storage = getStorageAdapter()
    const key = (media.metadata as { key?: string })?.key
    
    if (key) {
      await storage.delete(key)
    }
  } catch (error) {
    console.warn('Failed to delete file from storage:', error)
    // Continue with database deletion even if storage delete fails
  }

  // Get context for normalization
  const storeId = media.storeId
  const itemId = media.itemId

  // Delete from database
  await prisma.mediaAsset.delete({
    where: { id: input.mediaId },
  })

  // Normalize sort order for remaining media
  if (storeId || itemId) {
    const remainingMedia = await prisma.mediaAsset.findMany({
      where: { storeId: storeId || null, itemId: itemId || null },
      orderBy: { sortIndex: 'asc' }
    })

    // Update sort indices to be sequential (0, 1, 2...)
    await prisma.$transaction(
      remainingMedia.map((asset, index) =>
        prisma.mediaAsset.update({
          where: { id: asset.id },
          data: { sortIndex: index }
        })
      )
    )
  }
}

export interface ListMediaInput {
  storeId?: string
  itemId?: string
  userId?: string
}

export const listMedia = async (input: ListMediaInput) => {
  const where: {
    storeId?: string | null
    itemId?: string | null
  } = {}

  if (input.storeId) {
    where.storeId = input.storeId
  }

  if (input.itemId) {
    where.itemId = input.itemId
  }

  const media = await prisma.mediaAsset.findMany({
    where,
    orderBy: [
      { sortIndex: 'asc' },
      { createdAt: 'desc' },
    ],
  })

  return media
}

export interface UpdateMediaSortInput {
  mediaId: string
  userId: string
  sortIndex: number
}

export const updateMediaSort = async (input: UpdateMediaSortInput): Promise<void> => {
  const media = await prisma.mediaAsset.findUnique({
    where: { id: input.mediaId },
    include: {
      store: true,
      item: {
        include: { store: true },
      },
    },
  })

  if (!media) {
    throw new Error('Media not found')
  }

  // Verify ownership
  const ownerId = media.store?.ownerUserId || media.item?.store.ownerUserId

  if (!ownerId || ownerId !== input.userId) {
    throw new Error('Unauthorized: You do not own this media')
  }

  await prisma.mediaAsset.update({
    where: { id: input.mediaId },
    data: { sortIndex: input.sortIndex },
  })
}

export interface ReorderMediaInput {
  mediaIds: string[]
  userId: string
}

export const reorderMedia = async (input: ReorderMediaInput): Promise<void> => {
  if (input.mediaIds.length === 0) {
    throw new Error('No media IDs provided')
  }

  // Get all media assets to verify ownership
  const mediaAssets = await prisma.mediaAsset.findMany({
    where: { id: { in: input.mediaIds } },
    include: {
      store: true,
      item: {
        include: { store: true },
      },
    },
  })

  if (mediaAssets.length !== input.mediaIds.length) {
    throw new Error('One or more media assets not found')
  }

  // Verify ownership for all assets
  for (const asset of mediaAssets) {
    const ownerId = asset.store?.ownerUserId || asset.item?.store.ownerUserId
    if (!ownerId || ownerId !== input.userId) {
      throw new Error('Unauthorized: You do not own all media assets')
    }
  }

  // Update sort indices in order
  await prisma.$transaction(
    input.mediaIds.map((mediaId, index) =>
      prisma.mediaAsset.update({
        where: { id: mediaId },
        data: { sortIndex: index }
      })
    )
  )
}

