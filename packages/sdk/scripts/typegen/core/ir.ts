/**
 * Intermediate Representation (IR) for Type Generation
 * 
 * This is the normalized, validated data structure that flows through
 * the typegen pipeline from config → codegen → emit.
 */

export interface TypeField {
  name: string
  tsType: string
  optional?: boolean
  defaultExpr?: string
  expr?: string
}

export interface ComputedField {
  name: string
  tsType: string
  optional?: boolean
  computeExpr: string // Runtime expression for mapper
}

export interface ResourceIR {
  // Core identification
  name: string
  type: string
  createType?: string
  
  // SDK Configuration
  apiClass: string
  sdkType: string
  sdkListMethod: string
  sdkGetMethod: string
  sdkCreateMethod?: string
  sdkUpdateMethod?: string
  sdkDeleteMethod?: string
  
  // Request parameter names
  sdkCreateRequestParam?: string
  sdkUpdateRequestParam?: string
  
  // Method parameters
  listParams?: string
  
  // Feature flags
  hasCreate?: boolean
  hasUpdate?: boolean
  hasDelete?: boolean
  
  // Custom implementations
  updateCustom?: string
  
  // React Query configuration
  invalidates?: string[]
  methods?: string[]
  hooks?: {
    useList?: string
    useOne?: string
    useCreate?: string
    useUpdate?: string
    useDelete?: string
  }
  
  // Type extensions (normalized)
  extensions: TypeField[]
  
  // Computed fields (normalized)
  computed: ComputedField[]
  
  // Validation metadata
  validation?: {
    requiredFields: string[]
    reservedNames: string[]
    duplicateFields: string[]
  }
}

export interface TypegenIR {
  resources: ResourceIR[]
  metadata: {
    generatedAt: string
    version: string
    source: 'resource-config'
  }
}

export interface GenerationContext {
  outputPath: string
  tempDir: string
  prettierConfig?: string
  tsconfigPath?: string
}
