import { z } from 'zod';
// ========================================
// DTO Auto-Generator from Prisma Schema
// Creates DTOs with smart defaults, allows overrides
// ========================================
/**
 * Field type mapping from Prisma to Zod
 */
export const PrismaToZodMap = {
    String: () => z.string(),
    Int: () => z.number().int(),
    Float: () => z.number(),
    Boolean: () => z.boolean(),
    DateTime: () => z.string().datetime(),
    Decimal: () => z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
    Json: () => z.record(z.unknown()),
};
/**
 * Fields that should be excluded from create/update inputs
 */
export const AUTO_EXCLUDED_FIELDS = [
    'id',
    'createdAt',
    'updatedAt',
    'passwordHash', // Security
    'tokenRef', // Security
];
/**
 * Generate CREATE input schema from field definitions
 */
export function generateCreateInputSchema(config) {
    const shape = {};
    const excludeSet = new Set([...AUTO_EXCLUDED_FIELDS, ...(config.exclude || [])]);
    for (const field of config.fields) {
        // Skip excluded fields
        if (excludeSet.has(field.name))
            continue;
        // Skip relations (handled separately)
        if (field.isRelation)
            continue;
        // Use override if provided
        if (config.overrides?.[field.name]) {
            shape[field.name] = config.overrides[field.name];
            continue;
        }
        // Auto-generate from type
        let schema = PrismaToZodMap[field.type]?.();
        if (!schema) {
            console.warn(`Unknown Prisma type: ${field.type} for field ${field.name}`);
            schema = z.unknown();
        }
        // Handle optional/nullable
        if (field.isOptional || field.hasDefault) {
            schema = schema.optional();
        }
        shape[field.name] = schema;
    }
    return z.object(shape);
}
/**
 * Generate UPDATE input schema (all fields optional)
 */
export function generateUpdateInputSchema(config) {
    const shape = {};
    const excludeSet = new Set([
        ...AUTO_EXCLUDED_FIELDS,
        ...(config.exclude || []),
        'createdById', // Can't change creator
        'ownerUserId', // Can't transfer ownership via update
    ]);
    for (const field of config.fields) {
        if (excludeSet.has(field.name))
            continue;
        if (field.isRelation)
            continue;
        // Use override if provided
        if (config.overrides?.[field.name]) {
            shape[field.name] = config.overrides[field.name].optional();
            continue;
        }
        // Auto-generate from type
        let schema = PrismaToZodMap[field.type]?.();
        if (!schema) {
            schema = z.unknown();
        }
        // All update fields are optional
        shape[field.name] = schema.optional();
    }
    return z.object(shape).refine(data => Object.keys(data).length > 0, 'At least one field must be provided');
}
/**
 * Generate RESPONSE schema (all fields from model)
 */
export function generateResponseSchema(config) {
    const shape = {};
    const excludeSet = new Set([
        'passwordHash', // Never expose passwords
        'tokenRef', // Never expose tokens
        ...(config.exclude || []),
    ]);
    for (const field of config.fields) {
        if (excludeSet.has(field.name))
            continue;
        if (field.isRelation)
            continue; // Relations handled separately
        // Use override if provided
        if (config.overrides?.[field.name]) {
            shape[field.name] = config.overrides[field.name];
            continue;
        }
        // Auto-generate from type
        let schema = PrismaToZodMap[field.type]?.();
        if (!schema) {
            schema = z.unknown();
        }
        // Handle nullable (not optional in responses)
        if (field.isOptional) {
            schema = schema.nullable();
        }
        shape[field.name] = schema;
    }
    return z.object(shape);
}
/**
 * Generate list response schema
 */
export function generateListResponseSchema(responseSchema) {
    return z.object({
        data: z.array(responseSchema),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
    });
}
/**
 * Generate query schema for list operations
 */
export function generateQuerySchema(config) {
    const shape = {
        page: z.string().transform(Number).default('1'),
        limit: z.string().transform(Number).default('20'),
        ...config?.additionalFilters || {},
    };
    return z.object(shape).transform(data => ({
        page: data.page,
        limit: data.limit,
        filters: Object.keys(data)
            .filter(k => k !== 'page' && k !== 'limit' && data[k] !== undefined)
            .reduce((acc, k) => ({ ...acc, [k]: data[k] }), {}),
        orderBy: { createdAt: 'desc' },
    }));
}
/**
 * Helper to define model fields (manual for now, could be extracted from Prisma)
 */
export function defineFields(fields) {
    return fields.map(f => ({ ...f, isRelation: false }));
}
