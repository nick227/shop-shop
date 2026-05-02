import type { ResourceDefinition, ResourceOperations, CrudOperation, Role } from './types.js'

// ========================================
// Resource Factory
// Declarative resource definition builder
// ========================================

function defaultResourcePath(name: string): string {
  if (name === 'address') {
    return '/addresses'
  }
  return `/${name}s`
}

export function defineResource(
  config: Omit<ResourceDefinition, 'path'> & { path?: string }
): ResourceDefinition {
  const path = config.path ?? defaultResourcePath(config.name)
  return {
    ...config,
    path,
  }
}

export function getResourceOperations(resource: ResourceDefinition): ResourceOperations {
  return {
    hasCreate: resource.operations.includes('create'),
    hasRead: resource.operations.includes('read'),
    hasUpdate: resource.operations.includes('update'),
    hasDelete: resource.operations.includes('delete'),
    hasList: resource.operations.includes('list'),
  }
}

export function getRequiredRoles(resource: ResourceDefinition, operation: CrudOperation): Role[] {
  return resource.access[operation] || []
}

export function requiresAuthentication(resource: ResourceDefinition, operation: CrudOperation): boolean {
  const roles = getRequiredRoles(resource, operation)
  return roles.length > 0
}

export function validateResourceDefinition(resource: ResourceDefinition): void {
  if (!resource.name) {
    throw new Error('Resource name is required')
  }
  
  if (!resource.model) {
    throw new Error('Resource model is required')
  }
  
  if (!resource.operations || resource.operations.length === 0) {
    throw new Error('At least one operation is required')
  }
  
  // Validate required schemas for operations
  const ops = getResourceOperations(resource)
  
  if (ops.hasCreate && !resource.schemas.create) {
    throw new Error(`Create schema is required for resource: ${resource.name}`)
  }
  
  if (ops.hasUpdate && !resource.schemas.update) {
    throw new Error(`Update schema is required for resource: ${resource.name}`)
  }
  
  if ((ops.hasRead || ops.hasCreate || ops.hasUpdate) && !resource.schemas.response) {
    throw new Error(`Response schema is required for resource: ${resource.name}`)
  }
  
  if (ops.hasList && !resource.schemas.list) {
    throw new Error(`List schema is required for resource: ${resource.name}`)
  }
}

