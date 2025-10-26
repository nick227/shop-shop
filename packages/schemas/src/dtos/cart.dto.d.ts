import { z } from 'zod';
export declare const AddToCartInputSchema: z.ZodObject<{
    storeId: z.ZodString;
    itemId: z.ZodString;
    quantity: z.ZodNumber;
    optionsJson: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    storeId: string;
    itemId: string;
    quantity: number;
    optionsJson?: Record<string, unknown> | undefined;
    notes?: string | undefined;
}, {
    storeId: string;
    itemId: string;
    quantity: number;
    optionsJson?: Record<string, unknown> | undefined;
    notes?: string | undefined;
}>;
export declare const UpdateCartItemInputSchema: z.ZodObject<{
    quantity: z.ZodNumber;
    optionsJson: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    quantity: number;
    optionsJson?: Record<string, unknown> | undefined;
    notes?: string | undefined;
}, {
    quantity: number;
    optionsJson?: Record<string, unknown> | undefined;
    notes?: string | undefined;
}>;
export declare const CartResponseSchema: z.ZodObject<{
    [x: string]: z.ZodTypeAny;
} & {
    items: z.ZodArray<z.ZodObject<Record<string, z.ZodTypeAny>, z.UnknownKeysParam, z.ZodTypeAny, {
        [x: string]: any;
    }, {
        [x: string]: any;
    }>, "many">;
}, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
    items?: unknown;
}, {
    [x: string]: any;
    items?: unknown;
}>;
export declare const CartListResponseSchema: z.ZodObject<Record<string, z.ZodTypeAny>, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
}, {
    [x: string]: any;
}>;
export type AddToCartInput = z.infer<typeof AddToCartInputSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemInputSchema>;
export type CartResponse = z.infer<typeof CartResponseSchema>;
export type CartListResponse = z.infer<typeof CartListResponseSchema>;
//# sourceMappingURL=cart.dto.d.ts.map