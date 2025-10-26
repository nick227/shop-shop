import { z } from 'zod';
/**
 * Field type mapping from Prisma to Zod
 */
export declare const PrismaToZodMap: {
    readonly String: () => z.ZodString;
    readonly Int: () => z.ZodNumber;
    readonly Float: () => z.ZodNumber;
    readonly Boolean: () => z.ZodBoolean;
    readonly DateTime: () => z.ZodString;
    readonly Decimal: () => z.ZodString;
    readonly Json: () => z.ZodRecord<z.ZodString, z.ZodUnknown>;
};
/**
 * Fields that should be excluded from create/update inputs
 */
export declare const AUTO_EXCLUDED_FIELDS: readonly ["id", "createdAt", "updatedAt", "passwordHash", "tokenRef"];
/**
 * Generate CREATE input schema from field definitions
 */
export declare function generateCreateInputSchema(config: {
    fields: FieldDefinition[];
    exclude?: string[];
    overrides?: Record<string, z.ZodTypeAny>;
}): z.ZodObject<Record<string, z.ZodTypeAny>>;
/**
 * Generate UPDATE input schema (all fields optional)
 */
export declare function generateUpdateInputSchema(config: {
    fields: FieldDefinition[];
    exclude?: string[];
    overrides?: Record<string, z.ZodTypeAny>;
}): z.ZodTypeAny;
/**
 * Generate RESPONSE schema (all fields from model)
 */
export declare function generateResponseSchema(config: {
    fields: FieldDefinition[];
    exclude?: string[];
    overrides?: Record<string, z.ZodTypeAny>;
}): z.ZodObject<Record<string, z.ZodTypeAny>>;
/**
 * Generate list response schema
 */
export declare function generateListResponseSchema(responseSchema: z.ZodTypeAny): z.ZodObject<Record<string, z.ZodTypeAny>>;
/**
 * Generate query schema for list operations
 */
export declare function generateQuerySchema(config?: {
    additionalFilters?: Record<string, z.ZodTypeAny>;
}): z.ZodTypeAny;
export interface FieldDefinition {
    name: string;
    type: string;
    isOptional: boolean;
    isRelation: boolean;
    hasDefault: boolean;
}
/**
 * Helper to define model fields (manual for now, could be extracted from Prisma)
 */
export declare function defineFields(fields: Omit<FieldDefinition, 'isRelation'>[]): FieldDefinition[];
//# sourceMappingURL=dto.generator.d.ts.map