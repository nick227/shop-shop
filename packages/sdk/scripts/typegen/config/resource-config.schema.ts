/**
 * Zod schema for resource configuration validation
 * 
 * Ensures resource configs are properly structured and validated.
 */

import { z } from 'zod'

/**
 * Schema for type field definitions
 */
export const TypeFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  tsType: z.string().min(1, 'TypeScript type is required'),
  optional: z.boolean().optional(),
  defaultExpr: z.string().optional(),
  expr: z.string().optional(),
})

/**
 * Schema for resource configuration
 */
export const ResourceConfigSchema = z.object({
  // Core identification
  name: z.string().min(1, 'Resource name is required'),
  type: z.string().min(1, 'Resource type is required'),
  createType: z.string().optional(),
  
  // SDK Configuration
  apiClass: z.string().min(1, 'API class is required'),
  sdkType: z.string().min(1, 'SDK type is required'),
  sdkListMethod: z.string().min(1, 'SDK list method is required'),
  sdkGetMethod: z.string().min(1, 'SDK get method is required'),
  sdkCreateMethod: z.string().optional(),
  sdkUpdateMethod: z.string().optional(),
  sdkDeleteMethod: z.string().optional(),
  
  // Request parameter names
  sdkCreateRequestParam: z.string().optional(),
  sdkUpdateRequestParam: z.string().optional(),
  
  // Method parameters
  listParams: z.string().optional(),
  
  // Feature flags
  hasCreate: z.boolean().optional(),
  hasUpdate: z.boolean().optional(),
  hasDelete: z.boolean().optional(),
  
  // Custom implementations
  updateCustom: z.string().optional(),
  
  // React Query configuration
  invalidates: z.array(z.string()).optional(),
  methods: z.array(z.string()).optional(),
  hooks: z.object({
    useList: z.string().optional(),
    useOne: z.string().optional(),
    useCreate: z.string().optional(),
    useUpdate: z.string().optional(),
    useDelete: z.string().optional(),
  }).optional(),
  
  // Type extensions (legacy format for backward compatibility)
  extensions: z.record(z.string()).optional(),
  
  // Computed fields (legacy format for backward compatibility)
  computed: z.string().optional(),
})

/**
 * Schema for array of resource configurations
 */
export const ResourceConfigsSchema = z.array(ResourceConfigSchema)

/**
 * Validate a single resource configuration
 */
export function validateResourceConfig(config: unknown) {
  return ResourceConfigSchema.parse(config)
}

/**
 * Validate multiple resource configurations
 */
export function validateResourceConfigs(configs: unknown[]) {
  return ResourceConfigsSchema.parse(configs)
}

/**
 * Type-safe resource configuration
 */
export type ResourceConfig = z.infer<typeof ResourceConfigSchema>
export type TypeField = z.infer<typeof TypeFieldSchema>
