import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
import type { StorageAdapter, UploadFile, UploadResult } from './storage.adapter.js'

// ========================================
// Cloudflare R2 Storage Adapter
// S3-compatible storage from Cloudflare
// ========================================

export class R2StorageAdapter implements StorageAdapter {
  private client: S3Client
  private bucketName: string
  private publicUrl: string

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID
    const accessKeyId = process.env.R2_ACCESS_KEY_ID
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
    this.bucketName = process.env.R2_BUCKET_NAME || 'media'
    this.publicUrl = process.env.R2_PUBLIC_URL || ''

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('R2 credentials not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY')
    }

    // Configure S3 client for Cloudflare R2
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  }

  async upload(file: UploadFile): Promise<UploadResult> {
    // Generate unique key
    const extension = file.filename.split('.').pop()
    const uuid = randomUUID()
    const folder = file.folder || 'media'
    const key = `${folder}/${uuid}.${extension}`

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentLength: file.size,
      // Optional: Set cache control
      CacheControl: 'public, max-age=31536000, immutable',
    })

    await this.client.send(command)

    // Generate public URL
    const url = this.publicUrl 
      ? `${this.publicUrl}/${key}`
      : `https://${this.bucketName}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`

    return {
      key,
      url,
      size: file.size,
      mimetype: file.mimetype,
    }
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })

    await this.client.send(command)
  }

  async getUrl(key: string): Promise<string> {
    return this.publicUrl
      ? `${this.publicUrl}/${key}`
      : `https://${this.bucketName}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      await this.client.send(command)
      return true
    } catch (error) {
      return false
    }
  }
}

