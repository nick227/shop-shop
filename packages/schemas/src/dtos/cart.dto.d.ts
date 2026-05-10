import { z } from 'zod';
export declare const CreateCartInputSchema: z.ZodObject<{
    userId: z.ZodString;
    storeId: z.ZodString;
    status: z.ZodOptional<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    storeId: string;
    status?: string | undefined;
    order?: string | undefined;
    note?: string | undefined;
}, {
    userId: string;
    storeId: string;
    status?: string | undefined;
    order?: string | undefined;
    note?: string | undefined;
}>;
export declare const UpdateCartInputSchema: z.ZodEffects<z.ZodObject<{
    userId: z.ZodOptional<z.ZodString>;
    storeId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: string | undefined;
    order?: string | undefined;
    userId?: string | undefined;
    storeId?: string | undefined;
    note?: string | undefined;
}, {
    status?: string | undefined;
    order?: string | undefined;
    userId?: string | undefined;
    storeId?: string | undefined;
    note?: string | undefined;
}>, {
    status?: string | undefined;
    order?: string | undefined;
    userId?: string | undefined;
    storeId?: string | undefined;
    note?: string | undefined;
}, {
    status?: string | undefined;
    order?: string | undefined;
    userId?: string | undefined;
    storeId?: string | undefined;
    note?: string | undefined;
}>;
export declare const CartResponseSchema: z.ZodObject<{
    userId: z.ZodString;
    storeId: z.ZodString;
    user: z.ZodString;
    store: z.ZodString;
    status: z.ZodNullable<z.ZodString>;
    note: z.ZodNullable<z.ZodString>;
    items: z.ZodString;
    order: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    items: string;
    status: string | null;
    order: string | null;
    user: string;
    store: string;
    userId: string;
    storeId: string;
    note: string | null;
}, {
    items: string;
    status: string | null;
    order: string | null;
    user: string;
    store: string;
    userId: string;
    storeId: string;
    note: string | null;
}>;
export declare const CartListResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        userId: z.ZodString;
        storeId: z.ZodString;
        user: z.ZodString;
        store: z.ZodString;
        status: z.ZodNullable<z.ZodString>;
        note: z.ZodNullable<z.ZodString>;
        items: z.ZodString;
        order: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        items: string;
        status: string | null;
        order: string | null;
        user: string;
        store: string;
        userId: string;
        storeId: string;
        note: string | null;
    }, {
        items: string;
        status: string | null;
        order: string | null;
        user: string;
        store: string;
        userId: string;
        storeId: string;
        note: string | null;
    }>, "many">;
    total: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    total: number;
    data: {
        items: string;
        status: string | null;
        order: string | null;
        user: string;
        store: string;
        userId: string;
        storeId: string;
        note: string | null;
    }[];
    page: number;
    limit: number;
}, {
    total: number;
    data: {
        items: string;
        status: string | null;
        order: string | null;
        user: string;
        store: string;
        userId: string;
        storeId: string;
        note: string | null;
    }[];
    page: number;
    limit: number;
}>;
export declare const CartQuerySchema: z.ZodEffects<z.ZodObject<{
    page: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: string | undefined;
    limit?: string | undefined;
}>, {
    page: number;
    limit: number;
    filters: {};
    orderBy: {
        createdAt: string;
    };
}, {
    page?: string | undefined;
    limit?: string | undefined;
}>;
export declare const AddToCartInputSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    itemId: z.ZodOptional<z.ZodString>;
    bundleId: z.ZodOptional<z.ZodString>;
    quantity: z.ZodOptional<z.ZodNumber>;
    options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    options?: Record<string, unknown> | undefined;
    itemId?: string | undefined;
    bundleId?: string | undefined;
    quantity?: number | undefined;
    notes?: string | undefined;
}, {
    options?: Record<string, unknown> | undefined;
    itemId?: string | undefined;
    bundleId?: string | undefined;
    quantity?: number | undefined;
    notes?: string | undefined;
}>, {
    options?: Record<string, unknown> | undefined;
    itemId?: string | undefined;
    bundleId?: string | undefined;
    quantity?: number | undefined;
    notes?: string | undefined;
}, {
    options?: Record<string, unknown> | undefined;
    itemId?: string | undefined;
    bundleId?: string | undefined;
    quantity?: number | undefined;
    notes?: string | undefined;
}>, {
    options?: Record<string, unknown> | undefined;
    itemId?: string | undefined;
    bundleId?: string | undefined;
    quantity?: number | undefined;
    notes?: string | undefined;
}, {
    options?: Record<string, unknown> | undefined;
    itemId?: string | undefined;
    bundleId?: string | undefined;
    quantity?: number | undefined;
    notes?: string | undefined;
}>;
export type CreateCartInput = z.infer<typeof CreateCartInputSchema>;
export type UpdateCartInput = z.infer<typeof UpdateCartInputSchema>;
export type CartResponse = z.infer<typeof CartResponseSchema>;
export type CartListResponse = z.infer<typeof CartListResponseSchema>;
export type CartQuery = z.infer<typeof CartQuerySchema>;
export type AddToCartInput = z.infer<typeof AddToCartInputSchema>;
//# sourceMappingURL=cart.dto.d.ts.map