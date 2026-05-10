import { z } from 'zod';
// ========================================
// Address DTOs (Auto-Generated from Prisma)
// ========================================
export const CreateAddressInputSchema = z.object({
    userId: z.string(),
    label: z.string().optional(),
    contactName: z.string().optional(),
    phone: z.string().optional(),
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
    instructions: z.string().optional(),
    geo: z.record(z.unknown()).optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
    externalRef: z.string().optional(),
    archivedAt: z.string().datetime().optional()
});
export const UpdateAddressInputSchema = z.object({
    userId: z.string().optional(),
    label: z.string().optional(),
    contactName: z.string().optional(),
    phone: z.string().optional(),
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
    instructions: z.string().optional(),
    geo: z.record(z.unknown()).optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
    externalRef: z.string().optional(),
    archivedAt: z.string().datetime().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided');
export const AddressResponseSchema = z.object({
    userId: z.string(),
    user: z.string(),
    label: z.string().nullable(),
    contactName: z.string().nullable(),
    phone: z.string().nullable(),
    line1: z.string(),
    line2: z.string().nullable(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
    instructions: z.string().nullable(),
    geo: z.record(z.unknown()).nullable(),
    isDefault: z.boolean().nullable(),
    isActive: z.boolean().nullable(),
    externalRef: z.string().nullable(),
    orders: z.string(),
    archivedAt: z.string().datetime().nullable()
});
export const AddressListResponseSchema = z.object({
    data: z.array(AddressResponseSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
});
export const AddressQuerySchema = z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
}).transform(data => ({
    page: data.page,
    limit: data.limit,
    filters: Object.keys(data)
        .filter(k => k !== 'page' && k !== 'limit' && data[k] !== undefined)
        .reduce((acc, k) => ({ ...acc, [k]: data[k] }), {}),
    orderBy: { createdAt: 'desc' },
}));
