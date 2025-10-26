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

  // Verify ownership
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
      sortIndex: input.sortIndex || 0,
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

  // Delete from database
  await prisma.mediaAsset.delete({
    where: { id: input.mediaId },
  })
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

