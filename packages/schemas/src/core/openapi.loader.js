import { z } from 'zod';
import { getResourceOperations } from './resource.factory.js';
// ========================================
// OpenAPI Auto-Loader
// Auto-generates OpenAPI paths from resource definitions
// ========================================
export function registerResourceInOpenAPI(registry, resource, errorSchema) {
    const ops = getResourceOperations(resource);
    // CREATE - POST /resource
    if (ops.hasCreate) {
        registry.registerPath({
            operationId: `create${capitalize(resource.name)}`,
            method: 'post',
            path: resource.path,
            tags: [capitalize(resource.name) + 's'],
            summary: `Create ${resource.name}`,
            request: {
                body: {
                    content: {
                        'application/json': { schema: resource.schemas.create }
                    }
                }
            },
            responses: {
                201: {
                    description: `${capitalize(resource.name)} created`,
                    content: { 'application/json': { schema: resource.schemas.response } }
                },
                400: {
                    description: 'Validation error',
                    content: { 'application/json': { schema: errorSchema } }
                },
            },
        });
    }
    // LIST - GET /resources
    if (ops.hasList) {
        const pathConfig = {
            operationId: `list${capitalize(resource.name)}s`,
            method: 'get',
            path: resource.path,
            tags: [capitalize(resource.name) + 's'],
            summary: `List ${resource.name}s`,
            responses: {
                200: {
                    description: `List of ${resource.name}s`,
                    content: { 'application/json': { schema: resource.schemas.list } }
                }
            },
        };
        // Add query parameters if query schema exists
        if (resource.schemas.query) {
            pathConfig.request = {
                query: resource.schemas.query
            };
        }
        registry.registerPath(pathConfig);
    }
    // READ - GET /resource/:id
    if (ops.hasRead) {
        registry.registerPath({
            operationId: `get${capitalize(resource.name)}ById`,
            method: 'get',
            path: `${resource.path}/{id}`,
            tags: [capitalize(resource.name) + 's'],
            summary: `Get ${resource.name} by ID`,
            request: {
                params: z.object({ id: z.string().uuid() })
            },
            responses: {
                200: {
                    description: `${capitalize(resource.name)} found`,
                    content: { 'application/json': { schema: resource.schemas.response } }
                },
                404: {
                    description: 'Not found',
                    content: { 'application/json': { schema: errorSchema } }
                }
            },
        });
    }
    // UPDATE - PATCH /resource/:id
    if (ops.hasUpdate) {
        registry.registerPath({
            operationId: `update${capitalize(resource.name)}`,
            method: 'patch',
            path: `${resource.path}/{id}`,
            tags: [capitalize(resource.name) + 's'],
            summary: `Update ${resource.name}`,
            request: {
                params: z.object({ id: z.string().uuid() }),
                body: {
                    content: {
                        'application/json': { schema: resource.schemas.update }
                    }
                }
            },
            responses: {
                200: {
                    description: `${capitalize(resource.name)} updated`,
                    content: { 'application/json': { schema: resource.schemas.response } }
                },
                404: {
                    description: 'Not found',
                    content: { 'application/json': { schema: errorSchema } }
                }
            },
        });
    }
    // DELETE - DELETE /resource/:id
    if (ops.hasDelete) {
        registry.registerPath({
            operationId: `delete${capitalize(resource.name)}`,
            method: 'delete',
            path: `${resource.path}/{id}`,
            tags: [capitalize(resource.name) + 's'],
            summary: `Delete ${resource.name}`,
            request: {
                params: z.object({ id: z.string().uuid() })
            },
            responses: {
                204: { description: 'Deleted' },
                404: {
                    description: 'Not found',
                    content: { 'application/json': { schema: errorSchema } }
                }
            },
        });
    }
}
/**
 * Register all resources in OpenAPI registry
 */
export function registerAllResourcesInOpenAPI(registry, resources, errorSchema) {
    for (const resource of resources) {
        // Register component schemas (only if defined)
        if (resource.schemas.create) {
            registry.register(`Create${capitalize(resource.name)}Input`, resource.schemas.create);
        }
        if (resource.schemas.update) {
            registry.register(`Update${capitalize(resource.name)}Input`, resource.schemas.update);
        }
        registry.register(`${capitalize(resource.name)}Response`, resource.schemas.response);
        registry.register(`${capitalize(resource.name)}ListResponse`, resource.schemas.list);
        // Register paths
        registerResourceInOpenAPI(registry, resource, errorSchema);
    }
}
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
