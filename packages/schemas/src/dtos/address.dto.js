import { z } from 'zod';
import { defineFields, generateCreateInputSchema, generateUpdateInputSchema, generateResponseSchema, generateListResponseSchema, } from '../core/dto.generator.js';
// ========================================
// Address DTOs (Aligned with Prisma Schema)
// ========================================
const addressFields = defineFields([
    { name: 'id', type: 'String', isOptional: false, hasDefault: true },
    { name: 'userId', type: 'String', isOptional: false, hasDefault: false },
    { name: 'label', type: 'String', isOptional: true, hasDefault: false },
    { name: 'contactName', type: 'String', isOptional: true, hasDefault: false },
    { name: 'phone', type: 'String', isOptional: true, hasDefault: false },
    { name: 'line1', type: 'String', isOptional: false, hasDefault: false },
    { name: 'line2', type: 'String', isOptional: true, hasDefault: false },
    { name: 'city', type: 'String', isOptional: false, hasDefault: false },
    { name: 'state', type: 'String', isOptional: false, hasDefault: false },
    { name: 'postalCode', type: 'String', isOptional: false, hasDefault: false },
    { name: 'country', type: 'String', isOptional: false, hasDefault: true },
    { name: 'instructions', type: 'String', isOptional: true, hasDefault: false },
    { name: 'geo', type: 'Json', isOptional: true, hasDefault: false },
    { name: 'isDefault', type: 'Boolean', isOptional: false, hasDefault: true },
    { name: 'isActive', type: 'Boolean', isOptional: false, hasDefault: true },
    { name: 'externalRef', type: 'String', isOptional: true, hasDefault: false },
    { name: 'createdAt', type: 'DateTime', isOptional: false, hasDefault: true },
    { name: 'updatedAt', type: 'DateTime', isOptional: false, hasDefault: true },
    { name: 'archivedAt', type: 'DateTime', isOptional: true, hasDefault: false },
]);
export const CreateAddressInputSchema = generateCreateInputSchema({
    fields: addressFields,
    exclude: ['userId'], // Injected from context
    overrides: {
        label: z.string().max(50).optional().describe('Label (e.g., "Home", "Work")'),
        contactName: z.string().max(100).optional().describe('Recipient name'),
        phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional().describe('Contact phone'),
        line1: z.string().min(1).max(200).describe('Street address line 1'),
        line2: z.string().max(200).optional().describe('Street address line 2'),
        city: z.string().min(1).max(100).describe('City'),
        state: z.string().min(2).max(2).describe('State code (e.g., CA)'),
        postalCode: z.string().regex(/^\d{5}(-\d{4})?$/).describe('ZIP code'),
        instructions: z.string().max(500).optional().describe('Delivery instructions'),
    },
});
export const UpdateAddressInputSchema = generateUpdateInputSchema({
    fields: addressFields,
    overrides: {
        label: z.string().max(50).optional().describe('Label (e.g., "Home", "Work")'),
        contactName: z.string().max(100).optional().describe('Recipient name'),
        phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional().describe('Contact phone'),
        line1: z.string().min(1).max(200).optional().describe('Street address line 1'),
        line2: z.string().max(200).optional().describe('Street address line 2'),
        city: z.string().min(1).max(100).optional().describe('City'),
        state: z.string().min(2).max(2).optional().describe('State code'),
        postalCode: z.string().regex(/^\d{5}(-\d{4})?$/).optional().describe('ZIP code'),
        instructions: z.string().max(500).optional().describe('Delivery instructions'),
    },
});
export const AddressResponseSchema = generateResponseSchema({
    fields: addressFields,
});
export const AddressListResponseSchema = generateListResponseSchema(AddressResponseSchema);
