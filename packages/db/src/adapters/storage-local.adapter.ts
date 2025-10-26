import { promises as fs } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import type { StorageAdapter, UploadFile, UploadResult } from './storage.adapter.js'
import 'dotenv/config'

// ========================================
// Local Filesystem Storage Adapter
// Stores files in local uploads directory
// ========================================

export class LocalStorageAdapter implements StorageAdapter {
  private uploadDir: string
  private baseUrl: string

  constructor() {
    // Default to uploads directory in project root
    this.uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads')
    this.baseUrl = process.env.UPLOAD_BASE_URL || 'http://localhost:' + process.env.PORT + '/uploads'
    
    // Ensure upload directory exists
    this.ensureUploadDir()
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir)
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true })
    }
  }

  async upload(file: UploadFile): Promise<UploadResult> {
    // Generate unique filename
    const extension = file.filename.split('.').pop()
    const uuid = randomUUID()
    const folder = file.folder || 'media'
    const key = `${folder}/${uuid}.${extension}`

    // Ensure folder exists
    const folderPath = join(this.uploadDir, folder)
    await fs.mkdir(folderPath, { recursive: true })

    // Write file
    const filePath = join(this.uploadDir, key)
    await fs.writeFile(filePath, file.buffer)

    // Generate public URL
    const url = `${this.baseUrl}/${key}`

    return {
      key,
      url,
      size: file.size,
      mimetype: file.mimetype,
    }
  }

  async delete(key: string): Promise<void> {
    const filePath = join(this.uploadDir, key)
    
    try {
      await fs.unlink(filePath)
    } catch (error) {
      // File might not exist, ignore error
      console.warn(`Failed to delete file: ${key}`, error)
    }
  }

  async getUrl(key: string): Promise<string> {
    return `${this.baseUrl}/${key}`
  }

  async exists(key: string): Promise<boolean> {
    try {
      const filePath = join(this.uploadDir, key)
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }
}

