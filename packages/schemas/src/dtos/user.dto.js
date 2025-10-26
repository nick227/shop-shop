import { z } from 'zod';
import { defineFields, generateUpdateInputSchema, generateListResponseSchema, } from '../core/dto.generator.js';
import { UserPublicResponseSchema } from './auth.dto.js';
// ========================================
// User DTOs (Profile Management)
// Note: User creation handled by auth signup
// ========================================
const userFields = defineFields([
    { name: 'id', type: 'String', isOptional: false, hasDefault: true },
    { name: 'email', type: 'String', isOptional: false, hasDefault: false },
    { name: 'name', type: 'String', isOptional: true, hasDefault: false },
    { name: 'phone', type: 'String', isOptional: true, hasDefault: false },
    { name: 'role', type: 'String', isOptional: false, hasDefault: true },
    { name: 'isCompany', type: 'Boolean', isOptional: false, hasDefault: true },
    { name: 'companyName', type: 'String', isOptional: true, hasDefault: false },
    { name: 'createdAt', type: 'DateTime', isOptional: false, hasDefault: true },
    { name: 'updatedAt', type: 'DateTime', isOptional: false, hasDefault: true },
]);
// Update profile schema - only safe fields
export const UpdateUserProfileInputSchema = generateUpdateInputSchema({
    fields: userFields,
    exclude: ['id', 'email', 'role', 'createdAt', 'updatedAt'], // Protected fields
    overrides: {
        name: z.string().min(1).max(100).trim().optional().describe('Full name'),
        phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional().describe('Phone number (E.164 format)'),
        isCompany: z.boolean().optional().describe('Whether this is a business account'),
        companyName: z.string().min(1).max(200).trim().optional().describe('Company name (required if isCompany is true)'),
    },
});
// Reuse UserPublicResponseSchema from auth for consistency
export const UserResponseSchema = UserPublicResponseSchema;
export const UserListResponseSchema = generateListResponseSchema(UserResponseSchema);
