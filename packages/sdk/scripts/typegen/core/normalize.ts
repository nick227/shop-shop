/**
 * Normalize resource configurations to IR
 * 
 * Converts loose config objects to typed, validated IR structures.
 */

import { z } from 'zod'
import { ResourceIR, TypeField, ComputedField } from './ir.js'
import { 
  toSingular, 
  toResponseTypeName, 
  toMapperFunctionName, 
  toApiClassName, 
  toSdkTypeName,
  toSdkListMethodName,
  toSdkGetMethodName,
  toSdkCreateMethodName,
  toSdkUpdateMethodName,
  toSdkDeleteMethodName
} from './inflection.js'

// Zod schema for validating resource configs
const TypeFieldSchema = z.object({
  name: z.string().min(1),
  tsType: z.string().min(1),
  optional: z.boolean().optional(),
  defaultExpr: z.string().optional(),
  expr: z.string().optional(),
})

const ResourceConfigSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  createType: z.string().optional(),
  apiClass: z.string().min(1),
  sdkType: z.string().min(1),
  sdkListMethod: z.string().min(1),
  sdkGetMethod: z.string().min(1),
  sdkCreateMethod: z.string().optional(),
  sdkUpdateMethod: z.string().optional(),
  sdkDeleteMethod: z.string().optional(),
  sdkCreateRequestParam: z.string().optional(),
  sdkUpdateRequestParam: z.string().optional(),
  listParams: z.string().optional(),
  hasCreate: z.boolean().optional(),
  hasUpdate: z.boolean().optional(),
  hasDelete: z.boolean().optional(),
  updateCustom: z.string().optional(),
  invalidates: z.array(z.string()).optional(),
  methods: z.array(z.string()).optional(),
  hooks: z.object({
    useList: z.string().optional(),
    useOne: z.string().optional(),
    useCreate: z.string().optional(),
    useUpdate: z.string().optional(),
    useDelete: z.string().optional(),
  }).optional(),
  extensions: z.record(z.string()).optional(),
  computed: z.string().optional(),
})

/**
 * Parse extensions from loose record format
 */
function parseExtensions(extensions: Record<string, string> = {}): TypeField[] {
  return Object.entries(extensions).map(([name, tsType]) => ({
    name,
    tsType,
    optional: false,
  }))
}

/**
 * Parse computed fields from string format
 */
function parseComputed(computed: string = ''): ComputedField[] {
  if (!computed.trim()) return []
  
  const lines = computed.split('\n').filter(line => line.trim())
  const fields: ComputedField[] = []
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    
    // Parse field definition: "fieldName: expression" or "fieldName: type = expression"
    const colonIndex = trimmed.indexOf(':')
    if (colonIndex === -1) continue
    
    const name = trimmed.slice(0, colonIndex).trim()
    const rest = trimmed.slice(colonIndex + 1).trim()
    
    // Check if it has a type annotation
    const equalsIndex = rest.indexOf('=')
    let tsType = 'any'
    let computeExpr = rest
    
    if (equalsIndex !== -1) {
      tsType = rest.slice(0, equalsIndex).trim()
      computeExpr = rest.slice(equalsIndex + 1).trim()
    }
    
    fields.push({
      name,
      tsType,
      computeExpr,
      optional: false,
    })
  }
  
  return fields
}

/**
 * Validate field names and check for conflicts
 */
function validateFields(resource: ResourceIR): ResourceIR {
  const allFieldNames = new Set<string>()
  const reservedNames = new Set(['id', 'createdAt', 'updatedAt', 'deletedAt'])
  const duplicateFields: string[] = []
  const reservedFields: string[] = []
  
  // Check extensions
  for (const field of resource.extensions) {
    if (allFieldNames.has(field.name)) {
      duplicateFields.push(field.name)
    } else {
      allFieldNames.add(field.name)
    }
    
    if (reservedNames.has(field.name)) {
      reservedFields.push(field.name)
    }
  }
  
  // Check computed fields
  for (const field of resource.computed) {
    if (allFieldNames.has(field.name)) {
      duplicateFields.push(field.name)
    } else {
      allFieldNames.add(field.name)
    }
    
    if (reservedNames.has(field.name)) {
      reservedFields.push(field.name)
    }
  }
  
  return {
    ...resource,
    validation: {
      requiredFields: resource.extensions.filter(f => !f.optional).map(f => f.name),
      reservedNames: reservedFields,
      duplicateFields,
    }
  }
}

/**
 * Normalize a single resource configuration to IR
 */
export function normalizeResourceConfig(config: any): ResourceIR {
  // Validate input
  const validated = ResourceConfigSchema.parse(config)
  
  // Generate derived names using inflection utilities
  const singularName = toSingular(validated.type)
  const responseTypeName = toResponseTypeName(validated.type)
  const mapperFunctionName = toMapperFunctionName(validated.type)
  const apiClassName = toApiClassName(validated.type)
  
  // Parse extensions and computed fields
  const extensions = parseExtensions(validated.extensions)
  const computed = parseComputed(validated.computed)
  
  // Build the IR
  const resource: ResourceIR = {
    name: validated.name,
    type: validated.type,
    createType: validated.createType,
    apiClass: apiClassName,
    sdkType: validated.sdkType,
    sdkListMethod: validated.sdkListMethod,
    sdkGetMethod: validated.sdkGetMethod,
    sdkCreateMethod: validated.sdkCreateMethod,
    sdkUpdateMethod: validated.sdkUpdateMethod,
    sdkDeleteMethod: validated.sdkDeleteMethod,
    sdkCreateRequestParam: validated.sdkCreateRequestParam,
    sdkUpdateRequestParam: validated.sdkUpdateRequestParam,
    listParams: validated.listParams,
    hasCreate: validated.hasCreate,
    hasUpdate: validated.hasUpdate,
    hasDelete: validated.hasDelete,
    updateCustom: validated.updateCustom,
    invalidates: validated.invalidates,
    methods: validated.methods,
    hooks: validated.hooks,
    extensions,
    computed,
  }
  
  // Validate and return
  return validateFields(resource)
}

/**
 * Normalize multiple resource configurations to IR
 */
export function normalizeResourceConfigs(configs: any[]): ResourceIR[] {
  return configs.map(normalizeResourceConfig)
}
