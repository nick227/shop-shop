import { prisma } from '../client.js'

// ========================================
// Base CRUD Service
// Generic database operations for any model
// ========================================

export interface BaseServiceConfig {
  model: string  // Prisma model name (e.g., 'User', 'Store', 'Item')
}

export interface FindManyParams {
  where?: Record<string, unknown>
  skip?: number
  take?: number
  orderBy?: Record<string, unknown>
  include?: Record<string, unknown>
}

export interface ListResult<T> {
  data: T[]
  total: number
}

export class BaseCrudService<T = unknown> {
  protected modelDelegate: {
    create: (args: { data: unknown }) => Promise<T>
    findUnique: (args: { where: { id: string }; include?: Record<string, unknown> }) => Promise<T | null>
    findMany: (args: { where?: unknown; skip?: number; take?: number; orderBy?: unknown; include?: unknown }) => Promise<T[]>
    count: (args: { where?: unknown }) => Promise<number>
    update: (args: { where: { id: string }; data: unknown }) => Promise<T>
    delete: (args: { where: { id: string } }) => Promise<void>
  }
  
  constructor(protected config: BaseServiceConfig) {
    // Dynamic model access from prisma client
    const modelKey = config.model.charAt(0).toLowerCase() + config.model.slice(1)
    this.modelDelegate = (prisma as any)[modelKey] as typeof this.modelDelegate
    
    if (!this.modelDelegate) {
      throw new Error(`Prisma model not found: ${config.model}`)
    }
  }
  
  async create(data: unknown): Promise<T> {
    return this.modelDelegate.create({ data })
  }
  
  async findById(id: string, include?: Record<string, unknown>): Promise<T | null> {
    return this.modelDelegate.findUnique({ 
      where: { id },
      include 
    })
  }
  
  async findMany(params: FindManyParams): Promise<ListResult<T>> {
    const { where, skip, take, orderBy, include } = params
    
    const [data, total] = await Promise.all([
      this.modelDelegate.findMany({
        where,
        skip,
        take,
        orderBy,
        include,
      }),
      this.modelDelegate.count({ where }),
    ])
    
    return { data, total }
  }
  
  async update(id: string, data: unknown): Promise<T> {
    return this.modelDelegate.update({
      where: { id },
      data,
    })
  }
  
  async delete(id: string): Promise<void> {
    await this.modelDelegate.delete({ 
      where: { id } 
    })
  }
  
  /**
   * Check if user owns/can access a resource
   * @param userId - User ID to check
   * @param resourceId - Resource ID
   * @param relationPath - Path to owner field (e.g., 'ownerUserId' or 'store.ownerUserId')
   */
  async canUserAccess(
    userId: string, 
    resourceId: string, 
    relationPath?: string
  ): Promise<boolean> {
    if (!relationPath) return false
    
    const resource = await this.findById(resourceId, this.getIncludeFromPath(relationPath))
    if (!resource) return false
    
    // Navigate relation path to find owner ID
    const ownerId = this.getValueFromPath(resource, relationPath)
    return ownerId === userId
  }
  
  private getIncludeFromPath(relationPath: string): Record<string, unknown> | undefined {
    // If path contains '.', need to include relation
    // e.g., 'store.ownerUserId' → { include: { store: true } }
    const parts = relationPath.split('.')
    if (parts.length === 1) return undefined
    
    return { [parts[0]]: true }
  }
  
  private getValueFromPath(obj: unknown, path: string): unknown {
    const keys = path.split('.')
    let current = obj
    
    for (const key of keys) {
      if (current === null || current === undefined) return undefined
      current = (current as any)[key]
    }
    
    return current
  }
}

