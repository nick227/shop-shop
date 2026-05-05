#!/usr/bin/env tsx
/**
 * Auto-Generate DTOs from Prisma Schema
 * 
 * This script:
 * 1. Parses the Prisma schema
 * 2. Extracts model information
 * 3. Generates DTO files automatically
 * 4. Maintains custom overrides for validation rules
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseSchemaFile } from './prisma-schema-parser.js'
import { generateAllDTOs } from '../src/core/enhanced-dto.generator.js'
import { z } from 'zod'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ========================================
// Custom DTO Configurations
// Define custom overrides and exclusions for each model
// ========================================

const CUSTOM_DTO_CONFIGS: Record<string, {
  overrides?: Record<string, z.ZodTypeAny>
  excludes?: string[]
  skip?: boolean
}> = {
  // Store model customizations
  Store: {
    overrides: {
      slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, 'Must be lowercase letters, numbers, and hyphens'),
      name: z.string().min(1).max(100),
      description: z.string().max(1000).optional(),
      email: z.string().email().optional(),
      website: z.string().url().optional(),
      phone: z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).optional(),
    },
    excludes: ['ownerUserId'] // Injected from context
  },
  
  // Item model customizations
  Item: {
    overrides: {
      title: z.string().min(1).max(200),
      description: z.string().max(1000).optional(),
      price: z.string().regex(/^\d+(\.\d{1,2})?$/),
      stockQty: z.number().int().min(0).optional(),
    }
  },
  
  // User model customizations
  User: {
    overrides: {
      email: z.string().email(),
      name: z.string().min(1).max(100).optional(),
      phone: z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).optional(),
    },
    excludes: ['passwordHash'] // Security
  },
  
  // Order model customizations
  Order: {
    overrides: {
      status: z.enum(['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELED']),
      deliveryType: z.enum(['DELIVERY', 'PICKUP']),
      paymentStatus: z.enum(['UNPAID', 'PAID', 'REFUNDED']),
    },
    additionalSchemas: {
      UpdateOrderStatusSchema: z.object({
        status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'])
      }).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')
    }
  },
  
  // Cart model customizations
  Cart: {
    additionalSchemas: {
      AddToCartInputSchema: z.object({
        itemId: z.string(),
        quantity: z.number().int().min(1),
        options: z.record(z.unknown()).optional(),
        notes: z.string().optional(),
      })
    }
  },

  // MediaAsset model customizations (aliased as Media)
  MediaAsset: {
    additionalSchemas: {
      MediaResponseSchema: 'MediaAssetResponseSchema', // Alias
      MediaListResponseSchema: 'MediaAssetListResponseSchema', // Alias
      UpdateMediaSortInputSchema: z.object({
        sortIndex: z.number().int().min(0),
      }).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')
    }
  },

  // Bundle model customizations
  Bundle: {
    overrides: {
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      imageUrl: z.string().url().optional(),
    }
  },
  
  // Skip certain models that don't need DTOs
  SystemSetting: { skip: true },
  PaymentWebhook: { skip: true },
  GeocodingCache: { skip: true },
}

/**
 * Generate DTO files from Prisma schema
 */
async function generateDTOs() {
  console.log('🔄 Starting DTO generation from Prisma schema...')
  
  try {
    // Parse Prisma schema
    console.log('📊 Parsing Prisma schema...')
    const { models, enums } = parseSchemaFile()
    console.log(`✅ Parsed ${models.length} models and ${enums.length} enums`)
    
    console.log(`✅ Found ${models.length} models and ${enums.length} enums`)
    
    // Filter out skipped models
    const modelsToProcess = models.filter(model => !CUSTOM_DTO_CONFIGS[model.name]?.skip)
    
    console.log(`📝 Generating DTOs for ${modelsToProcess.length} models...`)
    
    // Generate DTOs
    const dtoResults = generateAllDTOs(modelsToProcess, CUSTOM_DTO_CONFIGS)
    
    // Ensure output directory exists
    const outputDir = path.resolve(__dirname, '../src/dtos')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    // Write DTO files
    let generatedCount = 0
    for (const { modelName, content } of dtoResults) {
      const fileName = `${modelName.toLowerCase()}.dto.ts`
      const filePath = path.join(outputDir, fileName)
      
      // Check if file exists
      const exists = fs.existsSync(filePath)
      const action = exists ? 'Updated' : 'Created'
      
      // Write file
      fs.writeFileSync(filePath, content)
      console.log(`✅ ${action}: ${fileName}`)
      generatedCount++
    }
    
    // Generate index file
    generateIndexFile(dtoResults, outputDir)
    
    console.log(`🎉 Successfully generated ${generatedCount} DTO files!`)
    console.log(`📁 Output directory: ${outputDir}`)
    
  } catch (error) {
    console.error('❌ Error generating DTOs:', error)
    process.exit(1)
  }
}

/**
 * Generate index file for all DTOs
 */
function generateIndexFile(dtoResults: Array<{ modelName: string; content: string }>, outputDir: string) {
  const indexContent = `/**
 * Auto-Generated DTO Index
 * 
 * DO NOT EDIT THIS FILE MANUALLY
 * Generated by: pnpm gen:dtos
 */

${dtoResults.map(({ modelName }) => 
  `export * from './${modelName.toLowerCase()}.dto.js'`
).join('\n')}
`

  const indexPath = path.join(outputDir, 'index.ts')
  fs.writeFileSync(indexPath, indexContent)
  console.log('✅ Generated: index.ts')
}

/**
 * Validate generated DTOs against existing ones
 */
function validateGeneratedDTOs() {
  console.log('🔍 Validating generated DTOs...')
  
  const outputDir = path.resolve(__dirname, '../src/dtos')
  const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.dto.ts') && f !== 'index.ts')
  
  for (const file of files) {
    const filePath = path.join(outputDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    
    // Basic validation - check for required exports
    const requiredExports = ['Schema', 'Input', 'Response', 'Query']
    const missingExports = requiredExports.filter(exportName => 
      !content.includes(exportName)
    )
    
    if (missingExports.length > 0) {
      console.warn(`⚠️  ${file} missing exports: ${missingExports.join(', ')}`)
    } else {
      console.log(`✅ ${file} validation passed`)
    }
  }
}

// CLI usage
console.log('🚀 Starting DTO generation script...')
generateDTOs()
  .then(() => {
    validateGeneratedDTOs()
    console.log('🎯 DTO generation completed successfully!')
  })
  .catch(error => {
    console.error('💥 DTO generation failed:', error)
    process.exit(1)
  })
