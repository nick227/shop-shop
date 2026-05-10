import { z } from 'zod';
export declare const CreateCartItemInputSchema: z.ZodObject<{
    cartId: z.ZodString;
    itemId: z.ZodString;
    titleSnapshot: z.ZodString;
    unitPrice: z.ZodString;
    quantity: z.ZodNumber;
    optionsJson: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    cartId: string;
    itemId: string;
    quantity: number;
    titleSnapshot: string;
    unitPrice: string;
    optionsJson?: Record<string, unknown> | undefined;
    notes?: string | undefined;
}, {
    cartId: string;
    itemId: string;
    quantity: number;
    titleSnapshot: string;
    unitPrice: string;
    optionsJson?: Record<string, unknown> | undefined;
    notes?: string | undefined;
}>;
export declare const UpdateCartItemInputSchema: z.ZodEffects<z.ZodObject<{
    cartId: z.ZodOptional<z.ZodString>;
    itemId: z.ZodOptional<z.ZodString>;
    titleSnapshot: z.ZodOptional<z.ZodString>;
    unitPrice: z.ZodOptional<z.ZodString>;
    quantity: z.ZodOptional<z.ZodNumber>;
    optionsJson: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    cartId?: string | undefined;
    optionsJson?: Record<string, unknown> | undefined;
    itemId?: string | undefined;
    quantity?: number | undefined;
    notes?: string | undefined;
    titleSnapshot?: string | undefined;
    unitPrice?: string | undefined;
}, {
    cartId?: string | undefined;
    optionsJson?: Record<string, unknown> | undefined;
    itemId?: string | undefined;
    quantity?: number | undefined;
    notes?: string | undefined;
    titleSnapshot?: string | undefined;
    unitPrice?: string | undefined;
}>, {
    cartId?: string | undefined;
    optionsJson?: Record<string, unknown> | undefined;
    itemId?: string | undefined;
    quantity?: number | undefined;
    notes?: string | undefined;
    titleSnapshot?: string | undefined;
    unitPrice?: string | undefined;
}, {
    cartId?: string | undefined;
    optionsJson?: Record<string, unknown> | undefined;
    itemId?: string | undefined;
    quantity?: number | undefined;
    notes?: string | undefined;
    titleSnapshot?: string | undefined;
    unitPrice?: string | undefined;
}>;
export declare const CartItemResponseSchema: z.ZodObject<{
    cartId: z.ZodString;
    cart: z.ZodString;
    itemId: z.ZodString;
    item: z.ZodString;
    titleSnapshot: z.ZodString;
    unitPrice: z.ZodString;
    quantity: z.ZodNumber;
    optionsJson: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    notes: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    item: string;
    cart: string;
    cartId: string;
    optionsJson: Record<string, unknown> | null;
    itemId: string;
    quantity: number;
    notes: string | null;
    titleSnapshot: string;
    unitPrice: string;
}, {
    item: string;
    cart: string;
    cartId: string;
    optionsJson: Record<string, unknown> | null;
    itemId: string;
    quantity: number;
    notes: string | null;
    titleSnapshot: string;
    unitPrice: string;
}>;
export declare const CartItemListResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        cartId: z.ZodString;
        cart: z.ZodString;
        itemId: z.ZodString;
        item: z.ZodString;
        titleSnapshot: z.ZodString;
        unitPrice: z.ZodString;
        quantity: z.ZodNumber;
        optionsJson: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        notes: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        item: string;
        cart: string;
        cartId: string;
        optionsJson: Record<string, unknown> | null;
        itemId: string;
        quantity: number;
        notes: string | null;
        titleSnapshot: string;
        unitPrice: string;
    }, {
        item: string;
        cart: string;
        cartId: string;
        optionsJson: Record<string, unknown> | null;
        itemId: string;
        quantity: number;
        notes: string | null;
        titleSnapshot: string;
        unitPrice: string;
    }>, "many">;
    total: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    total: number;
    data: {
        item: string;
        cart: string;
        cartId: string;
        optionsJson: Record<string, unknown> | null;
        itemId: string;
        quantity: number;
        notes: string | null;
        titleSnapshot: string;
        unitPrice: string;
    }[];
    page: number;
    limit: number;
}, {
    total: number;
    data: {
        item: string;
        cart: string;
        cartId: string;
        optionsJson: Record<string, unknown> | null;
        itemId: string;
        quantity: number;
        notes: string | null;
        titleSnapshot: string;
        unitPrice: string;
    }[];
    page: number;
    limit: number;
}>;
export declare const CartItemQuerySchema: z.ZodEffects<z.ZodObject<{
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
export type CreateCartItemInput = z.infer<typeof CreateCartItemInputSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemInputSchema>;
export type CartItemResponse = z.infer<typeof CartItemResponseSchema>;
export type CartItemListResponse = z.infer<typeof CartItemListResponseSchema>;
export type CartItemQuery = z.infer<typeof CartItemQuerySchema>;
//# sourceMappingURL=cartitem.dto.d.ts.map