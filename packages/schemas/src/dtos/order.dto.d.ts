import { z } from 'zod';
export declare const CreateOrderInputSchema: z.ZodObject<{
    cartId: z.ZodString;
    deliveryType: z.ZodEnum<["DELIVERY", "PICKUP"]>;
    addressId: z.ZodOptional<z.ZodString>;
    tip: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    tip: string;
    cartId: string;
    deliveryType: "DELIVERY" | "PICKUP";
    addressId?: string | undefined;
}, {
    cartId: string;
    deliveryType: "DELIVERY" | "PICKUP";
    tip?: string | undefined;
    addressId?: string | undefined;
}>;
export declare const UpdateOrderStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["PLACED", "ACCEPTED", "PREPARING", "READY", "COMPLETED", "CANCELED"]>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "PLACED" | "ACCEPTED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELED";
    note?: string | undefined;
}, {
    status: "PLACED" | "ACCEPTED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELED";
    note?: string | undefined;
}>;
export declare const OrderResponseSchema: z.ZodObject<Record<string, z.ZodTypeAny>, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
}, {
    [x: string]: any;
}>;
export declare const OrderListResponseSchema: z.ZodObject<Record<string, z.ZodTypeAny>, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
}, {
    [x: string]: any;
}>;
export declare const OrderQuerySchema: z.ZodTypeAny;
export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;
export type UpdateOrderStatus = z.infer<typeof UpdateOrderStatusSchema>;
export type OrderResponse = z.infer<typeof OrderResponseSchema>;
export type OrderListResponse = z.infer<typeof OrderListResponseSchema>;
export type OrderQuery = z.infer<typeof OrderQuerySchema>;
//# sourceMappingURL=order.dto.d.ts.map