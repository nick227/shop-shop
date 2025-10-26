import { z } from 'zod';
import { defineFields, generateResponseSchema, generateListResponseSchema, } from '../core/dto.generator.js';
// ========================================
// Cart DTOs (Aligned with Prisma Schema)
// ========================================
const cartFields = defineFields([
    { name: 'id', type: 'String', isOptional: false, hasDefault: true },
    { name: 'userId', type: 'String', isOptional: false, hasDefault: false },
    { name: 'storeId', type: 'String', isOptional: false, hasDefault: false },
    { name: 'status', type: 'String', isOptional: false, hasDefault: true },
    { name: 'note', type: 'String', isOptional: true, hasDefault: false },
    { name: 'createdAt', type: 'DateTime', isOptional: false, hasDefault: true },
    { name: 'updatedAt', type: 'DateTime', isOptional: false, hasDefault: true },
]);
const cartItemFields = defineFields([
    { name: 'id', type: 'String', isOptional: false, hasDefault: true },
    { name: 'cartId', type: 'String', isOptional: false, hasDefault: false },
    { name: 'itemId', type: 'String', isOptional: false, hasDefault: false },
    { name: 'titleSnapshot', type: 'String', isOptional: false, hasDefault: false },
    { name: 'unitPrice', type: 'Decimal', isOptional: false, hasDefault: false },
    { name: 'quantity', type: 'Int', isOptional: false, hasDefault: false },
    { name: 'optionsJson', type: 'Json', isOptional: true, hasDefault: false },
    { name: 'notes', type: 'String', isOptional: true, hasDefault: false },
    { name: 'createdAt', type: 'DateTime', isOptional: false, hasDefault: true },
]);
// Add item to cart
export const AddToCartInputSchema = z.object({
    storeId: z.string().uuid().describe('Store ID'),
    itemId: z.string().uuid().describe('Item ID to add to cart'),
    quantity: z.number().int().min(1).max(99).describe('Quantity'),
    optionsJson: z.record(z.unknown()).optional().describe('Selected options (e.g., size, extras)'),
    notes: z.string().max(500).optional().describe('Special instructions'),
});
// Update cart item quantity
export const UpdateCartItemInputSchema = z.object({
    quantity: z.number().int().min(0).max(99).describe('Quantity (0 to remove)'),
    optionsJson: z.record(z.unknown()).optional().describe('Selected options'),
    notes: z.string().max(500).optional().describe('Special instructions'),
});
// Cart response with items
export const CartResponseSchema = generateResponseSchema({
    fields: cartFields,
}).extend({
    items: z.array(generateResponseSchema({
        fields: cartItemFields,
    })),
});
export const CartListResponseSchema = generateListResponseSchema(CartResponseSchema);
