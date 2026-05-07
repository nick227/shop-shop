import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { registry, registerAllResourcesInOpenAPI, ErrorResponseSchema } from './index.js'
import { MediaAssetResponseSchema, UploadMediaInputSchema } from './dtos/index.js' // eslint-disable-line @typescript-eslint/no-unused-vars
import { z } from 'zod'
import fs from 'node:fs'
import path from 'node:path'
import 'dotenv/config'

// Import resources from server (only for OpenAPI generation)
// @ts-expect-error - importing from outside package for build script
import { ALL_RESOURCES } from '../../../apps/server/src/resources/index.ts'

// Register all resources in OpenAPI registry
registerAllResourcesInOpenAPI(registry, ALL_RESOURCES, ErrorResponseSchema)

// Register custom media upload endpoint (multipart/form-data)
registry.registerPath({
  operationId: 'uploadMedia',
  method: 'post',
  path: '/media/upload',
  tags: ['Media'],
  summary: 'Upload media file',
  description: 'Upload image or video file using multipart/form-data',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            file: z.any().describe('Image or video file (max 50MB)'),
            storeId: z.string().uuid().optional().describe('Store ID (for store media)'),
            itemId: z.string().uuid().optional().describe('Item ID (for item media)'),
            altText: z.string().max(200).optional().describe('Alternative text for accessibility'),
            sortIndex: z.number().int().min(0).optional().describe('Display order (default: 0)'),
          })
        }
      }
    }
  },
  responses: {
    201: {
      description: 'Media uploaded successfully',
      content: { 'application/json': { schema: MediaAssetResponseSchema } }
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorResponseSchema } }
    },
    404: {
      description: 'Store or item not found',
      content: { 'application/json': { schema: ErrorResponseSchema } }
    }
  }
})

const generator = new OpenApiGeneratorV3(registry.definitions)

// Use environment variable or fallback to localhost
const serverUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`

const doc = generator.generateDocument({
  openapi: '3.0.3',
  info: { title: 'Delivery API', version: '0.1.0' },
  servers: [{ url: serverUrl, description: 'API Server' }]
})
const outDir = path.resolve(process.cwd(), '../openapi')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'openapi.json'), JSON.stringify(doc, null, 2))
console.log('Generated', path.join(outDir, 'openapi.json'))
