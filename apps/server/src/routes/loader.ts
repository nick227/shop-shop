import type { FastifyInstance } from 'fastify'
import type { ResourceDefinition } from '@packages/schemas'
import { getResourceOperations, requiresAuthentication, getRequiredRoles } from '@packages/schemas'
import { BaseCrudController } from '@packages/db'
import { requireRole } from '../middleware/rbac.js'

// ========================================
// Route Auto-Loader
// Automatically registers CRUD routes for resources
// ========================================

/**
 * Register a single resource with all its CRUD operations
 */
export async function registerResource(
  app: FastifyInstance,
  resource: ResourceDefinition,
  prefix?: string
) {
  const controller = new BaseCrudController(resource)
  const ops = getResourceOperations(resource)
  const fullPath = prefix ? `${prefix}${resource.path}` : resource.path
  
  app.log.info({ resource: resource.name, path: resource.path, fullPath, prefix }, 'Registering resource')
  
  // CREATE - POST /resources
  if (ops.hasCreate) {
    const roles = getRequiredRoles(resource, 'create')
    const preHandler = requiresAuthentication(resource, 'create')
      ? [requireRole(roles)]
      : []
    
    app.post(fullPath, {
      preHandler,
      schema: {
        tags: [resource.name],
        summary: `Create ${resource.name}`,
      },
    }, controller.create.bind(controller))
    
    app.log.info({ 
      method: 'POST', 
      path: fullPath,
      auth: roles.length > 0,
      roles 
    }, 'Route registered')
  }
  
  // LIST - GET /resources
  if (ops.hasList) {
    const roles = getRequiredRoles(resource, 'list')
    const preHandler = requiresAuthentication(resource, 'list')
      ? [requireRole(roles)]
      : []
    
    app.get(fullPath, {
      preHandler,
      schema: {
        tags: [resource.name],
        summary: `List ${resource.name}s`,
      },
    }, controller.list.bind(controller))
    
    app.log.info({ 
      method: 'GET', 
      path: fullPath,
      auth: roles.length > 0,
      roles 
    }, 'Route registered')
  }
  
  // READ - GET /resources/:id
  if (ops.hasRead) {
    const roles = getRequiredRoles(resource, 'read')
    const preHandler = requiresAuthentication(resource, 'read')
      ? [requireRole(roles)]
      : []
    
    app.get(`${fullPath}/:id`, {
      preHandler,
      schema: {
        tags: [resource.name],
        summary: `Get ${resource.name} by ID`,
      },
    }, controller.findById.bind(controller))
    
    app.log.info({ 
      method: 'GET', 
      path: `${fullPath}/:id`,
      auth: roles.length > 0,
      roles 
    }, 'Route registered')
  }
  
  // UPDATE - PATCH /resources/:id
  if (ops.hasUpdate) {
    const roles = getRequiredRoles(resource, 'update')
    const preHandler = requiresAuthentication(resource, 'update')
      ? [requireRole(roles)]
      : []
    
    app.patch(`${fullPath}/:id`, {
      preHandler,
      schema: {
        tags: [resource.name],
        summary: `Update ${resource.name}`,
      },
    }, controller.update.bind(controller))
    
    app.log.info({ 
      method: 'PATCH', 
      path: `${fullPath}/:id`,
      auth: roles.length > 0,
      roles,
      ownership: resource.ownership?.enabled || false
    }, 'Route registered')
  }
  
  // DELETE - DELETE /resources/:id
  if (ops.hasDelete) {
    const roles = getRequiredRoles(resource, 'delete')
    const preHandler = requiresAuthentication(resource, 'delete')
      ? [requireRole(roles)]
      : []
    
    app.delete(`${fullPath}/:id`, {
      preHandler,
      schema: {
        tags: [resource.name],
        summary: `Delete ${resource.name}`,
      },
    }, controller.delete.bind(controller))
    
    app.log.info({ 
      method: 'DELETE', 
      path: `${fullPath}/:id`,
      auth: roles.length > 0,
      roles,
      ownership: resource.ownership?.enabled || false
    }, 'Route registered')
  }
}

/**
 * Register all resources from a list
 */
export async function registerAllResources(
  app: FastifyInstance,
  resources: readonly ResourceDefinition[],
  options?: { prefix?: string }
) {
  app.log.info({ count: resources.length, prefix: options?.prefix }, 'Registering all resources')
  
  for (const resource of resources) {
    if (options?.prefix) {
      await registerResource(app, resource, options.prefix)
    } else {
      await registerResource(app, resource)
    }
  }
  
  app.log.info('All resources registered successfully')
}

