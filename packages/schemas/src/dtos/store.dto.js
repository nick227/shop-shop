import { z } from 'zod';
import { defineFields, generateCreateInputSchema, generateUpdateInputSchema, generateResponseSchema, generateListResponseSchema, generateQuerySchema, } from '../core/dto.generator.js';
// ========================================
// Store DTOs (Auto-Generated from Prisma)
// ========================================
// Define Store model fields (from Prisma schema)
const storeFields = defineFields([
    { name: 'id', type: 'String', isOptional: false, hasDefault: true },
    { name: 'ownerUserId', type: 'String', isOptional: false, hasDefault: false },
    { name: 'name', type: 'String', isOptional: false, hasDefault: false },
    { name: 'slug', type: 'String', isOptional: false, hasDefault: false },
    { name: 'description', type: 'String', isOptional: true, hasDefault: false },
    // Company Information
    { name: 'companyName', type: 'String', isOptional: true, hasDefault: false },
    { name: 'taxId', type: 'String', isOptional: true, hasDefault: false },
    { name: 'phone', type: 'String', isOptional: true, hasDefault: false },
    { name: 'email', type: 'String', isOptional: true, hasDefault: false },
    { name: 'website', type: 'String', isOptional: true, hasDefault: false },
    // Settings
    { name: 'isPublished', type: 'Boolean', isOptional: false, hasDefault: true },
    { name: 'deliveryEnabled', type: 'Boolean', isOptional: false, hasDefault: true },
    { name: 'pickupEnabled', type: 'Boolean', isOptional: false, hasDefault: true },
    { name: 'prepTimeMin', type: 'Int', isOptional: false, hasDefault: true },
    { name: 'feesJson', type: 'Json', isOptional: true, hasDefault: false },
    { name: 'hoursJson', type: 'Json', isOptional: true, hasDefault: false },
    // Delivery Settings
    { name: 'deliveryDistance', type: 'Decimal', isOptional: true, hasDefault: false },
    { name: 'deliveryCharge', type: 'Decimal', isOptional: true, hasDefault: false },
    // Geolocation
    { name: 'latitude', type: 'Decimal', isOptional: true, hasDefault: false },
    { name: 'longitude', type: 'Decimal', isOptional: true, hasDefault: false },
    { name: 'addressStreet', type: 'String', isOptional: true, hasDefault: false },
    { name: 'addressCity', type: 'String', isOptional: true, hasDefault: false },
    { name: 'addressState', type: 'String', isOptional: true, hasDefault: false },
    { name: 'addressZip', type: 'String', isOptional: true, hasDefault: false },
    { name: 'addressCountry', type: 'String', isOptional: true, hasDefault: true },
    { name: 'geocodedAt', type: 'DateTime', isOptional: true, hasDefault: false },
    { name: 'geocodeSource', type: 'String', isOptional: true, hasDefault: false },
    // Stripe
    { name: 'stripeAccountId', type: 'String', isOptional: true, hasDefault: false },
    { name: 'stripeOnboarded', type: 'Boolean', isOptional: false, hasDefault: true },
    { name: 'commissionRate', type: 'Decimal', isOptional: true, hasDefault: false },
    { name: 'createdAt', type: 'DateTime', isOptional: false, hasDefault: true },
    { name: 'updatedAt', type: 'DateTime', isOptional: false, hasDefault: true },
]);
// Auto-generate with custom overrides
export const CreateStoreInputSchema = generateCreateInputSchema({
    fields: storeFields,
    exclude: ['ownerUserId'], // Injected from context
    overrides: {
        slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, 'Must be lowercase letters, numbers, and hyphens'),
        name: z.string().min(1).max(100),
        description: z.string().max(1000).optional(),
        companyName: z.string().min(1).max(200).optional(),
        taxId: z.string().max(50).optional(),
        phone: z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).optional(),
        email: z.string().email().optional(),
        website: z.string().url().optional(),
        deliveryDistance: z.string().regex(/^\d+(\.\d{1,2})?$/).refine(val => parseFloat(val) >= 0 && parseFloat(val) <= 100, 'Delivery distance must be between 0 and 100 miles').optional(),
        deliveryCharge: z.string().regex(/^\d+(\.\d{1,2})?$/).refine(val => parseFloat(val) >= 0, 'Delivery charge must be non-negative').optional(),
        latitude: z.string().regex(/^-?\d+(\.\d+)?$/).optional(),
        longitude: z.string().regex(/^-?\d+(\.\d+)?$/).optional(),
    },
});
export const UpdateStoreInputSchema = generateUpdateInputSchema({
    fields: storeFields,
    overrides: {
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(1000).optional(),
        slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/).optional(),
        companyName: z.string().min(1).max(200).optional(),
        taxId: z.string().max(50).optional(),
        phone: z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).optional(),
        email: z.string().email().optional(),
        website: z.string().url().optional(),
        commissionRate: z.string().regex(/^\d+(\.\d{1,2})?$/).refine(val => parseFloat(val) >= 0 && parseFloat(val) <= 100, 'Commission rate must be between 0 and 100').optional(),
        deliveryDistance: z.string().regex(/^\d+(\.\d{1,2})?$/).refine(val => parseFloat(val) >= 0 && parseFloat(val) <= 100, 'Delivery distance must be between 0 and 100 miles').optional(),
        deliveryCharge: z.string().regex(/^\d+(\.\d{1,2})?$/).refine(val => parseFloat(val) >= 0, 'Delivery charge must be non-negative').optional(),
        latitude: z.string().regex(/^-?\d+(\.\d+)?$/).optional(),
        longitude: z.string().regex(/^-?\d+(\.\d+)?$/).optional(),
    },
});
export const StoreResponseSchema = generateResponseSchema({
    fields: storeFields,
});
export const StoreListResponseSchema = generateListResponseSchema(StoreResponseSchema);
export const StoreQuerySchema = generateQuerySchema({
    additionalFilters: {
        isPublished: z.string().transform(val => val === 'true').optional(),
        ownerUserId: z.string().uuid().optional(),
        // Location-based filtering
        latitude: z.string().transform(Number).optional(),
        longitude: z.string().transform(Number).optional(),
        radiusMiles: z.string().transform(Number).default('25'), // Default 25 mile radius
        city: z.string().optional(),
        state: z.string().optional(),
        zip: z.string().optional(),
    },
});
// Extended response schema with distance field (computed)
export const StoreWithDistanceSchema = StoreResponseSchema.extend({
    distance: z.number().optional(), // Distance in miles from search location
});
