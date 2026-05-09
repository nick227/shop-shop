import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import type { AuthenticatedUser } from '../middleware/auth.js'
import {
  UploadMediaInputSchema,
  type UploadMediaInput,
  UpdateMediaSortInputSchema,
  type UpdateMediaSortInput,
} from '@packages/schemas'
import {
  uploadMedia,
  deleteMedia,
  listMedia,
  updateMediaSort,
  reorderMedia,
  type UploadFile,
} from '@packages/db'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

// ========================================
// Media Routes
// Handles file uploads to R2/local storage
// ========================================

interface AuthenticatedRequest extends FastifyRequest {
  user?: AuthenticatedUser
}

export const mediaRoutes = async (app: FastifyInstance) => {
  
  // ========================================
  // POST /media/upload
  // Upload image or video file
  // ========================================
  app.post('/media/upload', {
    preHandler: [authenticate, requireRole(['USER', 'VENDOR', 'ADMIN'])],  // Open platform: any user can upload media
    schema: {
      tags: ['Media'],
      summary: 'Upload media file',
      description: 'Upload image or video (max 10MB for images, 50MB for videos)',
      consumes: ['multipart/form-data'],
    },
  }, async (req: AuthenticatedRequest, reply) => {
    try {
      // Handle multipart form data
      const data = await req.file()
      
      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' })
      }

      // Read file buffer
      const buffer = await data.toBuffer()

      // Parse form fields
      const fields = data.fields as {
        storeId?: { value: string }
        itemId?: { value: string }
        altText?: { value: string }
        sortIndex?: { value: string }
      }

      // Validate input
      const input = UploadMediaInputSchema.parse({
        storeId: fields.storeId?.value,
        itemId: fields.itemId?.value,
        altText: fields.altText?.value,
        sortIndex: fields.sortIndex?.value ? parseInt(fields.sortIndex.value) : 0,
      }) as UploadMediaInput

      // Prepare upload file
      const uploadFile: UploadFile = {
        filename: data.filename,
        mimetype: data.mimetype,
        buffer,
        size: buffer.length,
      }

      // Upload media
      const result = await uploadMedia({
        file: uploadFile,
        storeId: input.storeId,
        itemId: input.itemId,
        userId: req.user!.id,
        userRole: req.user!.role,
        altText: input.altText,
        sortIndex: input.sortIndex,
      })

      req.log.info({
        event: 'media_uploaded',
        userId: req.user!.id,
        mediaId: result.id,
        size: result.size,
        kind: result.kind,
      }, 'Media uploaded')

      return reply.code(201).send(result)
    } catch (error) {
      // Zod validation error
      if (error && typeof error === 'object' && 'issues' in error) {
        return reply.code(400).send({
          error: 'Validation error',
          issues: (error as { issues: unknown[] }).issues,
        })
      }

      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('Unauthorized')) {
          return reply.code(404).send({ error: error.message })
        }
        if (error.message.includes('Invalid') || error.message.includes('too large')) {
          return reply.code(400).send({ error: error.message })
        }

        req.log.error({ err: error }, 'Media upload failed')
        return reply.code(500).send({ error: error.message })
      }

      req.log.error({ err: error }, 'Media upload failed (non-error)')
      return reply.code(500).send({ error: 'Media upload failed' })
    }
  })

  // ========================================
  // GET /media
  // List media files (public for stores, authenticated for items)
  // ========================================
  app.get('/media', {
    schema: {
      tags: ['Media'],
      summary: 'List media files',
      description: 'List media files for a store (public) or item (authenticated)',
      querystring: z.object({
        storeId: z.string().uuid().optional(),
        itemId: z.string().uuid().optional(),
      }),
    },
  }, async (req, reply) => {
    const { storeId, itemId } = req.query as { storeId?: string; itemId?: string }

    if (!storeId && !itemId) {
      return reply.code(400).send({
        error: 'Provide storeId or itemId to list media',
      })
    }

    // For public store media access, allow without authentication
    // For item media, require authentication
    if (storeId) {
      const media = await listMedia({
        storeId,
        itemId,
        userId: undefined, // Public access for store media
      })

      return reply.code(200).send({
        data: media,
        total: media.length,
      })
    } else {
      // Item media requires authentication
      const authenticatedReq = req as AuthenticatedRequest
      if (!authenticatedReq.user) {
        return reply.code(401).send({ error: 'Authentication required for item media' })
      }

      const media = await listMedia({
        storeId,
        itemId,
        userId: authenticatedReq.user.id,
      })

      return reply.code(200).send({
        data: media,
        total: media.length,
      })
    }
  })

  // ========================================
  // DELETE /media/:id
  // Delete media file
  // ========================================
  app.delete('/media/:id', {
    preHandler: [authenticate, requireRole(['USER', 'VENDOR', 'ADMIN'])],  // Open platform: any user can delete their own media
    schema: {
      tags: ['Media'],
      summary: 'Delete media file',
      description: 'Deletes media file from storage and database',
    },
  }, async (req: AuthenticatedRequest, reply) => {
    try {
      const { id } = req.params as { id: string }

      await deleteMedia({
        mediaId: id,
        userId: req.user!.id,
        userRole: req.user!.role,
      })

      req.log.info({
        event: 'media_deleted',
        userId: req.user!.id,
        mediaId: id,
      }, 'Media deleted')

      return reply.code(200).send({ success: true })
    } catch (error) {
      // Zod validation error (future-proofing)
      if (error && typeof error === 'object' && 'issues' in error) {
        return reply.code(400).send({
          error: 'Validation error',
          issues: (error as { issues: unknown[] }).issues,
        })
      }
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('Unauthorized')) {
          return reply.code(404).send({ error: error.message })
        }
      }
      throw error
    }
  })

  // ========================================
  // PATCH /media/:id/sort
  // Update media sort order
  // ========================================
  app.patch('/media/:id/sort', {
    preHandler: [authenticate, requireRole(['USER', 'VENDOR', 'ADMIN'])],  // Open platform: any user can update their own media
    schema: {
      tags: ['Media'],
      summary: 'Update media sort order',
      description: 'Changes display order of media file',
    },
  }, async (req: AuthenticatedRequest, reply) => {
    try {
      const { id } = req.params as { id: string }
      const input = UpdateMediaSortInputSchema.parse(req.body) as UpdateMediaSortInput

      await updateMediaSort({
        mediaId: id,
        userId: req.user!.id,
        userRole: req.user!.role,
        sortIndex: input.sortIndex,
      })

      return reply.code(200).send({ success: true })
    } catch (error) {
      // Zod validation error
      if (error && typeof error === 'object' && 'issues' in error) {
        return reply.code(400).send({
          error: 'Validation error',
          issues: (error as { issues: unknown[] }).issues,
        })
      }
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('Unauthorized')) {
          return reply.code(404).send({ error: error.message })
        }
      }
      throw error
    }
  })

  // ========================================
  // PATCH /media/reorder
  // Bulk reorder media files
  // ========================================
  app.patch('/media/reorder', {
    preHandler: [authenticate, requireRole(['USER', 'VENDOR', 'ADMIN'])],
    schema: {
      tags: ['Media'],
      summary: 'Reorder media files',
      description: 'Changes display order of multiple media files at once',
      body: {
        type: 'object',
        properties: {
          mediaIds: {
            type: 'array',
            items: { type: 'string', format: 'uuid' }
          }
        },
        required: ['mediaIds']
      }
    },
  }, async (req: AuthenticatedRequest, reply) => {
    try {
      const { mediaIds } = req.body as { mediaIds: string[] }

      await reorderMedia({
        mediaIds,
        userId: req.user!.id,
        userRole: req.user!.role,
      })

      return reply.code(200).send({ success: true })
    } catch (error) {
      // Zod validation error
      if (error && typeof error === 'object' && 'issues' in error) {
        return reply.code(400).send({
          error: 'Validation error',
          issues: (error as { issues: unknown[] }).issues,
        })
      }
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('Unauthorized')) {
          return reply.code(404).send({ error: error.message })
        }
        if (error.message.includes('No media IDs provided')) {
          return reply.code(400).send({ error: error.message })
        }
      }
      throw error
    }
  })
}

