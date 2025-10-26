import { z } from 'zod';
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { ResourceDefinition } from './types.js';
export declare function registerResourceInOpenAPI(registry: OpenAPIRegistry, resource: ResourceDefinition, errorSchema: z.ZodSchema): void;
/**
 * Register all resources in OpenAPI registry
 */
export declare function registerAllResourcesInOpenAPI(registry: OpenAPIRegistry, resources: readonly ResourceDefinition[], errorSchema: z.ZodSchema): void;
//# sourceMappingURL=openapi.loader.d.ts.map