import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ResourceDefinition, HookContext } from '@packages/schemas'
import { BaseCrudService } from '../services/base.service.js'

// ========================================
// Base CRUD Controller
// Generic HTTP handlers for any resource
// ========================================

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string
    role: 'USER' | 'VENDOR' | 'ADMIN' | 'AFFILIATE' | 'RIDER' | 'STAFF'
    email: string
    name: string | null
    phone: string | null
    createdAt: Date
    updatedAt: Date
  }
}

export class BaseCrudController {
  protected service: BaseCrudService
  
  constructor(protected resource: ResourceDefinition) {
    this.service = new BaseCrudService({ model: resource.model })
  }
  
  protected getHookContext(req: AuthenticatedRequest): HookContext {
    return {
      userId: req.user?.id,
      userRole: req.user?.role,
    }
  }

  /**
   * Optional authorizeAccess hook replaces default ownership checks when present.
   */
  protected async enforceAccess(
    req: AuthenticatedRequest,
    reply: FastifyReply,
    existing: unknown,
    operation: 'read' | 'update' | 'delete'
  ): Promise<boolean> {
    const user = req.user
    const authorize = this.resource.customHooks?.authorizeAccess

    if (authorize) {
      try {
        await authorize(existing, this.getHookContext(req), operation)
      } catch (err) {
        if (err instanceof Error && err.message === 'Forbidden') {
          reply.code(403).send({ error: 'Forbidden' })
          return false
        }
        throw err
      }
      return true
    }

    if (this.resource.ownership?.enabled && user && user.role !== 'ADMIN') {
      const resourceId = (existing as { id: string }).id
      const canAccess = await this.service.canUserAccess(
        user.id,
        resourceId,
        this.resource.ownership.relationPath
      )

      if (!canAccess) {
        const msg =
          operation === 'read'
            ? 'You do not have permission to view this resource'
            : operation === 'update'
              ? 'You do not have permission to update this resource'
              : 'You do not have permission to delete this resource'
        reply.code(403).send({ error: msg })
        return false
      }
    }
    return true
  }
  
  async create(req: AuthenticatedRequest, reply: FastifyReply) {
    try {
      // Validate input
      const input = this.resource.schemas.create!.parse(req.body)
      
      // Before hook - wrap in try-catch to handle authorization errors
      let processedInput
      try {
        processedInput = this.resource.customHooks?.beforeCreate
          ? await this.resource.customHooks.beforeCreate(input, this.getHookContext(req))
          : input
      } catch (hookError) {
        // All beforeCreate hook errors are authorization/business rule violations
        if (hookError instanceof Error) {
          return reply.code(403).send({ error: hookError.message })
        }
        throw hookError
      }
      
      // Check if hook already handled creation (e.g., complex business logic)
      let result
      if (processedInput && typeof processedInput === 'object' && '_skipCreate' in processedInput) {
        // Hook already created the resource, use the provided result
        result = (processedInput as { _result: unknown })._result
      } else {
        // Create resource normally
        result = await this.service.create(processedInput)
      }
      
      // After hook
      if (this.resource.customHooks?.afterCreate) {
        await this.resource.customHooks.afterCreate(result, this.getHookContext(req))
      }
      
      req.log.info({
        event: `${this.resource.name}_created`,
        resourceId: (result as { id: string }).id,
        userId: req.user?.id,
      }, `${this.resource.name} created`)
      
      return reply.code(201).send(result)
    } catch (error) {
      return this.handleError(error, reply)
    }
  }
  
  async findById(req: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string }
      let result = await this.service.findById(id)
      
      if (!result) {
        return reply.code(404).send({ 
          error: `${this.resource.name} not found` 
        })
      }

      const allowed = await this.enforceAccess(req, reply, result, 'read')
      if (!allowed) {
        return
      }
      
      // After read hook
      if (this.resource.customHooks?.afterRead) {
        result = await this.resource.customHooks.afterRead(result, this.getHookContext(req))
      }
      
      return reply.send(result)
    } catch (error) {
      return this.handleError(error, reply)
    }
  }
  
  async list(req: AuthenticatedRequest, reply: FastifyReply) {
    try {
      // Parse query params
      const querySchema = this.resource.schemas.query
      const query = querySchema ? querySchema.parse(req.query) : req.query as Record<string, unknown>
      
      const page = (query.page as number) || 1
      const limit = (query.limit as number) || 20
      
      // Extract filters from query
      const originalFilters = (query.filters as Record<string, unknown>) || {}
      let prismaFilters = originalFilters
      const orderBy = query.orderBy as Record<string, unknown> | undefined
      
      if (this.resource.customHooks?.beforeList) {
        prismaFilters = await this.resource.customHooks.beforeList(originalFilters, this.getHookContext(req)) as Record<string, unknown>
      }
      
      // Build find params
      let result = await this.service.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: prismaFilters,
        orderBy: orderBy || { createdAt: 'desc' },
      })
      
      // After list hook (pass ORIGINAL filters with location params)
      if (this.resource.customHooks?.afterList) {
        const hookContext = {
          ...this.getHookContext(req),
          filters: originalFilters, // Pass original filters with location params
        }
        const modifiedResult = await this.resource.customHooks.afterList(result, hookContext as never)
        if (modifiedResult) {
          result = modifiedResult as { data: unknown[], total: number }
        }
      }
      
      return reply.send({
        data: result.data,
        total: result.total,
        page,
        limit,
      })
    } catch (error) {
      return this.handleError(error, reply)
    }
  }
  
  async update(req: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string }
      const user = req.user!
      
      // Check if resource exists
      const existing = await this.service.findById(id)
      if (!existing) {
        return reply.code(404).send({ 
          error: `${this.resource.name} not found` 
        })
      }

      const allowedUpdate = await this.enforceAccess(req, reply, existing, 'update')
      if (!allowedUpdate) {
        return
      }
      
      // Validate input
      const input = this.resource.schemas.update!.parse(req.body)
      
      // Before hook
      const processedInput = this.resource.customHooks?.beforeUpdate
        ? await this.resource.customHooks.beforeUpdate(id, input, this.getHookContext(req))
        : input
      
      // Update resource
      const result = await this.service.update(id, processedInput)
      
      // After hook
      if (this.resource.customHooks?.afterUpdate) {
        await this.resource.customHooks.afterUpdate(result, this.getHookContext(req))
      }
      
      req.log.info({
        event: `${this.resource.name}_updated`,
        resourceId: id,
        userId: user.id,
      }, `${this.resource.name} updated`)
      
      return reply.send(result)
    } catch (error) {
      return this.handleError(error, reply, 'update')
    }
  }
  
  async delete(req: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string }
      const user = req.user!
      
      // Check if resource exists
      const existing = await this.service.findById(id)
      if (!existing) {
        return reply.code(404).send({ 
          error: `${this.resource.name} not found` 
        })
      }

      const allowedDelete = await this.enforceAccess(req, reply, existing, 'delete')
      if (!allowedDelete) {
        return
      }
      
      // Before hook
      if (this.resource.customHooks?.beforeDelete) {
        await this.resource.customHooks.beforeDelete(id, this.getHookContext(req))
      }
      
      // Delete resource
      await this.service.delete(id)
      
      // After hook
      if (this.resource.customHooks?.afterDelete) {
        await this.resource.customHooks.afterDelete(id, this.getHookContext(req))
      }
      
      req.log.info({
        event: `${this.resource.name}_deleted`,
        resourceId: id,
        userId: user.id,
      }, `${this.resource.name} deleted`)
      
      return reply.code(204).send()
    } catch (error) {
      return this.handleError(error, reply, 'delete')
    }
  }
  
  protected handleError(error: unknown, reply: FastifyReply, operation?: string) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return reply.code(403).send({ error: 'Forbidden' })
    }
    if (
      error instanceof Error &&
      (error.message === 'Assignee must be a rider' ||
        error.message === 'Assignee must be an active store driver' ||
        error.message === 'You cannot assign deliveries for this store')
    ) {
      return reply.code(400).send({ error: error.message })
    }

    // Zod validation error
    if (error && typeof error === 'object' && 'issues' in error) {
      return reply.code(400).send({
        error: 'Validation error',
        issues: (error as { issues: unknown[] }).issues,
      })
    }
    
    // Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { 
        code: string
        meta?: { target?: string[]; field_name?: string }
      }
      
      // Unique constraint violation
      if (prismaError.code === 'P2002') {
        return reply.code(409).send({
          error: 'Resource already exists',
          field: prismaError.meta?.target?.[0],
        })
      }
      
      // Record not found
      if (prismaError.code === 'P2025') {
        return reply.code(404).send({
          error: `${this.resource.name} not found`,
        })
      }
      
      // Foreign key constraint
      if (prismaError.code === 'P2003') {
        return reply.code(400).send({
          error: 'Invalid reference',
          field: prismaError.meta?.field_name,
        })
      }
    }
    
    // Re-throw unknown errors
    throw error
  }
}
