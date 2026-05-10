import { z } from 'zod';
export declare const CreateOrderEventInputSchema: z.ZodObject<{
    orderId: z.ZodString;
    status: z.ZodString;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: string;
    orderId: string;
    note?: string | undefined;
}, {
    status: string;
    orderId: string;
    note?: string | undefined;
}>;
export declare const UpdateOrderEventInputSchema: z.ZodEffects<z.ZodObject<{
    orderId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: string | undefined;
    note?: string | undefined;
    orderId?: string | undefined;
}, {
    status?: string | undefined;
    note?: string | undefined;
    orderId?: string | undefined;
}>, {
    status?: string | undefined;
    note?: string | undefined;
    orderId?: string | undefined;
}, {
    status?: string | undefined;
    note?: string | undefined;
    orderId?: string | undefined;
}>;
export declare const OrderEventResponseSchema: z.ZodObject<{
    orderId: z.ZodString;
    order: z.ZodString;
    status: z.ZodString;
    note: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: string;
    order: string;
    note: string | null;
    orderId: string;
}, {
    status: string;
    order: string;
    note: string | null;
    orderId: string;
}>;
export declare const OrderEventListResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        orderId: z.ZodString;
        order: z.ZodString;
        status: z.ZodString;
        note: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: string;
        order: string;
        note: string | null;
        orderId: string;
    }, {
        status: string;
        order: string;
        note: string | null;
        orderId: string;
    }>, "many">;
    total: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    total: number;
    data: {
        status: string;
        order: string;
        note: string | null;
        orderId: string;
    }[];
    page: number;
    limit: number;
}, {
    total: number;
    data: {
        status: string;
        order: string;
        note: string | null;
        orderId: string;
    }[];
    page: number;
    limit: number;
}>;
export declare const OrderEventQuerySchema: z.ZodEffects<z.ZodObject<{
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
export type CreateOrderEventInput = z.infer<typeof CreateOrderEventInputSchema>;
export type UpdateOrderEventInput = z.infer<typeof UpdateOrderEventInputSchema>;
export type OrderEventResponse = z.infer<typeof OrderEventResponseSchema>;
export type OrderEventListResponse = z.infer<typeof OrderEventListResponseSchema>;
export type OrderEventQuery = z.infer<typeof OrderEventQuerySchema>;
//# sourceMappingURL=orderevent.dto.d.ts.map