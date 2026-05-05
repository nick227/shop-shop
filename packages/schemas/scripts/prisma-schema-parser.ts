/**
 * Prisma Schema Parser
 * Parses Prisma schema files and extracts model information
 */

import { readFileSync } from 'fs'
import { join } from 'path'

export interface PrismaField {
  name: string
  type: string
  isOptional: boolean
  isArray: boolean
  isUnique: boolean
  isId: boolean
  hasDefault: boolean
  relationName?: string
  relationType?: 'oneToOne' | 'oneToMany' | 'manyToMany'
  enumValues?: string[]
  attributes: string[]
}

export interface PrismaModel {
  name: string
  fields: PrismaField[]
  primaryKey: string
  uniqueFields: string[]
  indexes: string[][]
  comment?: string
}

export interface PrismaEnum {
  name: string
  values: string[]
}

/**
 * Parse Prisma schema file and extract models and enums
 */
export function parsePrismaSchema(schemaPath: string): {
  models: PrismaModel[]
  enums: PrismaEnum[]
} {
  const schemaContent = readFileSync(schemaPath, 'utf-8')
  const models: PrismaModel[] = []
  const enums: PrismaEnum[] = []
  
  // Parse enums first
  const enumRegex = /enum\s+(\w+)\s*\{([^}]+)\}/g
  let enumMatch
  
  while ((enumMatch = enumRegex.exec(schemaContent)) !== null) {
    const enumName = enumMatch[1]
    const enumBody = enumMatch[2]
    
    const values = enumBody
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'))
      .map(line => line.replace(/\s*@\w+.*$/, '')) // Remove attributes
    
    enums.push({ name: enumName, values })
  }
  
  // Parse models
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g
  let modelMatch
  
  while ((modelMatch = modelRegex.exec(schemaContent)) !== null) {
    const modelName = modelMatch[1]
    const modelBody = modelMatch[2]
    
    const fields: PrismaField[] = []
    const fieldLines = modelBody.split('\n').filter(line => line.trim())
    
    for (const line of fieldLines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) continue
      
      const field = parseFieldLine(trimmed, enums)
      if (field) {
        fields.push(field)
      }
    }
    
    const primaryKey = fields.find(f => f.isId)?.name || 'id'
    const uniqueFields = fields.filter(f => f.isUnique).map(f => f.name)
    const indexes = extractIndexes(modelBody)
    
    models.push({
      name: modelName,
      fields,
      primaryKey,
      uniqueFields,
      indexes,
    })
  }
  
  return { models, enums }
}

/**
 * Parse a single field line
 */
function parseFieldLine(line: string, enums: PrismaEnum[]): PrismaField | null {
  // Match field definition: name type?[] @attributes
  const fieldMatch = line.match(/^(\w+)\s+(\w+)(\?)?(\[\])?\s*(.*)$/)
  if (!fieldMatch) return null
  
  const [, name, type, optional, array, attributesStr] = fieldMatch
  const isOptional = !!optional
  const isArray = !!array
  const attributes = attributesStr ? attributesStr.split(/\s+/).filter(Boolean) : []
  
  const isId = attributes.includes('@id')
  const isUnique = attributes.includes('@unique')
  const hasDefault = attributes.some(attr => attr.startsWith('@default'))
  
  // Check if type is an enum
  const enumDef = enums.find(e => e.name === type)
  if (enumDef) {
    return {
      name,
      type: 'Enum',
      isOptional,
      isArray,
      isUnique,
      isId,
      hasDefault,
      enumValues: enumDef.values,
      attributes,
    }
  }
  
  return {
    name,
    type,
    isOptional,
    isArray,
    isUnique,
    isId,
    hasDefault,
    attributes,
  }
}

/**
 * Extract indexes from model body
 */
function extractIndexes(modelBody: string): string[][] {
  const indexes: string[][] = []
  const indexRegex = /@@index\(\[([^\]]+)\]/g
  let indexMatch
  
  while ((indexMatch = indexRegex.exec(modelBody)) !== null) {
    const indexFields = indexMatch[1]
      .split(',')
      .map(field => field.trim().replace(/['"]/g, ''))
    indexes.push(indexFields)
  }
  
  return indexes
}

/**
 * Get the Prisma schema path
 */
export function getPrismaSchemaPath(): string {
  return join(process.cwd(), '../db/prisma/schema.prisma')
}