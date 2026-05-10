import { z } from 'zod';
export declare const CreateOrderItemInputSchema: z.ZodObject<{
    orderId: z.ZodString;
    itemId: z.ZodOptional<z.ZodString>;
    bundleId: z.ZodOptional<z.ZodString>;
    titleSnapshot: z.ZodString;
    unitPrice: z.ZodString;
    quantity: z.ZodNumber;
    optionsJson: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    quantity: number;
    titleSnapshot: string;
    unitPrice: string;
    orderId: string;
    optionsJson?: Record<string, unknown> | undefined;
    itemId?: string | undefined;
    bundleId?: string | undefined;
    notes?: string | undefined;
}, {
    quantity: number;
    titleSnapshot: string;
    unitPrice: string;
    orderId: string;
    optionsJson?: Record<string, unknown> | undefined;
    itemId?: string | undefined;
    bundleId?: string | undefined;
    notes?: string | undefined;
}>;
export declare const UpdateOrderItemInputSchema: z.ZodEffects<z.ZodObject<{
    orderId: z.ZodOptional<z.ZodString>;
    itemId: z.ZodOptional<z.ZodString>;
    bundleId: z.ZodOptional<z.ZodString>;
    titleSnapshot: z.ZodOptional<z.ZodString>;
    unitPrice: z.ZodOptional<z.ZodString>;
    quantity: z.ZodOptional<z.ZodNumber>;
    optionsJson: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    optionsJson?: Record<string, unknown> | undefined;
    itemId?: string | undefined;
    bundleId?: string | undefined;
    quantity?: number | undefined;
    notes?: string | undefined;
    titleSnapshot?: string | undefined;
    unitPrice?: string | undefined;
    orderId?: string | undefined;
}, {
    optionsJson?: Record<string, unknown> | undefined;
    itemId?: string | undefined;
    bundleId?: string | undefined;
    quantity?: number | undefined;
    notes?: string | undefined;
    titleSnapshot?: string | undefined;
    unitPrice?: string | undefined;
    orderId?: string | undefined;
}>, {
    optionsJson?: Record<string, unknown> | undefined;
    itemId?: string | undefined;
    bundleId?: string | undefined;
    quantity?: number | undefined;
    notes?: string | undefined;
    titleSnapshot?: string | undefined;
    unitPrice?: string | undefined;
    orderId?: string | undefined;
}, {
    optionsJson?: Record<string, unknown> | undefined;
    itemId?: string | undefined;
    bundleId?: string | undefined;
    quantity?: number | undefined;
    notes?: string | undefined;
    titleSnapshot?: string | undefined;
    unitPrice?: string | undefined;
    orderId?: string | undefined;
}>;
export declare const OrderItemResponseSchema: z.ZodObject<{
    orderId: z.ZodString;
    order: z.ZodString;
    itemId: z.ZodNullable<z.ZodString>;
    item: z.ZodNullable<z.ZodString>;
    bundleId: z.ZodNullable<z.ZodString>;
    bundle: z.ZodNullable<z.ZodString>;
    titleSnapshot: z.ZodString;
    unitPrice: z.ZodString;
    quantity: z.ZodNumber;
    optionsJson: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    notes: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    order: string;
    item: string | null;
    bundle: string | null;
    optionsJson: Record<string, unknown> | null;
    itemId: string | null;
    bundleId: string | null;
    quantity: number;
    notes: string | null;
    titleSnapshot: string;
    unitPrice: string;
    orderId: string;
}, {
    order: string;
    item: string | null;
    bundle: string | null;
    optionsJson: Record<string, unknown> | null;
    itemId: string | null;
    bundleId: string | null;
    quantity: number;
    notes: string | null;
    titleSnapshot: string;
    unitPrice: string;
    orderId: string;
}>;
export declare const OrderItemListResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        orderId: z.ZodString;
        order: z.ZodString;
        itemId: z.ZodNullable<z.ZodString>;
        item: z.ZodNullable<z.ZodString>;
        bundleId: z.ZodNullable<z.ZodString>;
        bundle: z.ZodNullable<z.ZodString>;
        titleSnapshot: z.ZodString;
        unitPrice: z.ZodString;
        quantity: z.ZodNumber;
        optionsJson: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        notes: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        order: string;
        item: string | null;
        bundle: string | null;
        optionsJson: Record<string, unknown> | null;
        itemId: string | null;
        bundleId: string | null;
        quantity: number;
        notes: string | null;
        titleSnapshot: string;
        unitPrice: string;
        orderId: string;
    }, {
        order: string;
        item: string | null;
        bundle: string | null;
        optionsJson: Record<string, unknown> | null;
        itemId: string | null;
        bundleId: string | null;
        quantity: number;
        notes: string | null;
        titleSnapshot: string;
        unitPrice: string;
        orderId: string;
    }>, "many">;
    total: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    total: number;
    data: {
        order: string;
        item: string | null;
        bundle: string | null;
        optionsJson: Record<string, unknown> | null;
        itemId: string | null;
        bundleId: string | null;
        quantity: number;
        notes: string | null;
        titleSnapshot: string;
        unitPrice: string;
        orderId: string;
    }[];
    page: number;
    limit: number;
}, {
    total: number;
    data: {
        order: string;
        item: string | null;
        bundle: string | null;
        optionsJson: Record<string, unknown> | null;
        itemId: string | null;
        bundleId: string | null;
        quantity: number;
        notes: string | null;
        titleSnapshot: string;
        unitPrice: string;
        orderId: string;
    }[];
    page: number;
    limit: number;
}>;
export declare const OrderItemQuerySchema: z.ZodEffects<z.ZodObject<{
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
export type CreateOrderItemInput = z.infer<typeof CreateOrderItemInputSchema>;
export type UpdateOrderItemInput = z.infer<typeof UpdateOrderItemInputSchema>;
export type OrderItemResponse = z.infer<typeof OrderItemResponseSchema>;
export type OrderItemListResponse = z.infer<typeof OrderItemListResponseSchema>;
export type OrderItemQuery = z.infer<typeof OrderItemQuerySchema>;
//# sourceMappingURL=orderitem.dto.d.ts.map