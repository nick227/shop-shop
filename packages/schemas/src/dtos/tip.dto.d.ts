import { z } from 'zod';
export declare const CreateTipInputSchema: z.ZodObject<{
    orderId: z.ZodString;
    amount: z.ZodString;
    status: z.ZodOptional<z.ZodString>;
    stripePaymentIntentId: z.ZodOptional<z.ZodString>;
    stripeChargeId: z.ZodOptional<z.ZodString>;
    stripeTransferId: z.ZodOptional<z.ZodString>;
    stripeApplicationFeeId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    orderId: string;
    amount: string;
    status?: string | undefined;
    stripePaymentIntentId?: string | undefined;
    stripeChargeId?: string | undefined;
    stripeTransferId?: string | undefined;
    stripeApplicationFeeId?: string | undefined;
}, {
    orderId: string;
    amount: string;
    status?: string | undefined;
    stripePaymentIntentId?: string | undefined;
    stripeChargeId?: string | undefined;
    stripeTransferId?: string | undefined;
    stripeApplicationFeeId?: string | undefined;
}>;
export declare const UpdateTipInputSchema: z.ZodEffects<z.ZodObject<{
    orderId: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    stripePaymentIntentId: z.ZodOptional<z.ZodString>;
    stripeChargeId: z.ZodOptional<z.ZodString>;
    stripeTransferId: z.ZodOptional<z.ZodString>;
    stripeApplicationFeeId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: string | undefined;
    stripePaymentIntentId?: string | undefined;
    stripeChargeId?: string | undefined;
    stripeTransferId?: string | undefined;
    stripeApplicationFeeId?: string | undefined;
    orderId?: string | undefined;
    amount?: string | undefined;
}, {
    status?: string | undefined;
    stripePaymentIntentId?: string | undefined;
    stripeChargeId?: string | undefined;
    stripeTransferId?: string | undefined;
    stripeApplicationFeeId?: string | undefined;
    orderId?: string | undefined;
    amount?: string | undefined;
}>, {
    status?: string | undefined;
    stripePaymentIntentId?: string | undefined;
    stripeChargeId?: string | undefined;
    stripeTransferId?: string | undefined;
    stripeApplicationFeeId?: string | undefined;
    orderId?: string | undefined;
    amount?: string | undefined;
}, {
    status?: string | undefined;
    stripePaymentIntentId?: string | undefined;
    stripeChargeId?: string | undefined;
    stripeTransferId?: string | undefined;
    stripeApplicationFeeId?: string | undefined;
    orderId?: string | undefined;
    amount?: string | undefined;
}>;
export declare const TipResponseSchema: z.ZodObject<{
    orderId: z.ZodString;
    order: z.ZodString;
    amount: z.ZodString;
    status: z.ZodNullable<z.ZodString>;
    stripePaymentIntentId: z.ZodNullable<z.ZodString>;
    stripeChargeId: z.ZodNullable<z.ZodString>;
    stripeTransferId: z.ZodNullable<z.ZodString>;
    stripeApplicationFeeId: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: string | null;
    order: string;
    stripePaymentIntentId: string | null;
    stripeChargeId: string | null;
    stripeTransferId: string | null;
    stripeApplicationFeeId: string | null;
    orderId: string;
    amount: string;
}, {
    status: string | null;
    order: string;
    stripePaymentIntentId: string | null;
    stripeChargeId: string | null;
    stripeTransferId: string | null;
    stripeApplicationFeeId: string | null;
    orderId: string;
    amount: string;
}>;
export declare const TipListResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        orderId: z.ZodString;
        order: z.ZodString;
        amount: z.ZodString;
        status: z.ZodNullable<z.ZodString>;
        stripePaymentIntentId: z.ZodNullable<z.ZodString>;
        stripeChargeId: z.ZodNullable<z.ZodString>;
        stripeTransferId: z.ZodNullable<z.ZodString>;
        stripeApplicationFeeId: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: string | null;
        order: string;
        stripePaymentIntentId: string | null;
        stripeChargeId: string | null;
        stripeTransferId: string | null;
        stripeApplicationFeeId: string | null;
        orderId: string;
        amount: string;
    }, {
        status: string | null;
        order: string;
        stripePaymentIntentId: string | null;
        stripeChargeId: string | null;
        stripeTransferId: string | null;
        stripeApplicationFeeId: string | null;
        orderId: string;
        amount: string;
    }>, "many">;
    total: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    total: number;
    data: {
        status: string | null;
        order: string;
        stripePaymentIntentId: string | null;
        stripeChargeId: string | null;
        stripeTransferId: string | null;
        stripeApplicationFeeId: string | null;
        orderId: string;
        amount: string;
    }[];
    page: number;
    limit: number;
}, {
    total: number;
    data: {
        status: string | null;
        order: string;
        stripePaymentIntentId: string | null;
        stripeChargeId: string | null;
        stripeTransferId: string | null;
        stripeApplicationFeeId: string | null;
        orderId: string;
        amount: string;
    }[];
    page: number;
    limit: number;
}>;
export declare const TipQuerySchema: z.ZodEffects<z.ZodObject<{
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
export declare const ProcessTipInputSchema: z.ZodObject<{
    paymentMethodId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    paymentMethodId: string;
}, {
    paymentMethodId: string;
}>;
export declare const TipStatusUpdateSchema: z.ZodObject<{
    status: z.ZodEnum<["PENDING", "PAID", "FAILED", "REFUNDED"]>;
    stripeChargeId: z.ZodOptional<z.ZodString>;
    stripeTransferId: z.ZodOptional<z.ZodString>;
    stripeApplicationFeeId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "PAID" | "REFUNDED" | "PENDING" | "FAILED";
    stripeChargeId?: string | undefined;
    stripeTransferId?: string | undefined;
    stripeApplicationFeeId?: string | undefined;
}, {
    status: "PAID" | "REFUNDED" | "PENDING" | "FAILED";
    stripeChargeId?: string | undefined;
    stripeTransferId?: string | undefined;
    stripeApplicationFeeId?: string | undefined;
}>;
export type CreateTipInput = z.infer<typeof CreateTipInputSchema>;
export type UpdateTipInput = z.infer<typeof UpdateTipInputSchema>;
export type TipResponse = z.infer<typeof TipResponseSchema>;
export type TipListResponse = z.infer<typeof TipListResponseSchema>;
export type TipQuery = z.infer<typeof TipQuerySchema>;
export type ProcessTipInput = z.infer<typeof ProcessTipInputSchema>;
export type TipStatusUpdate = z.infer<typeof TipStatusUpdateSchema>;
//# sourceMappingURL=tip.dto.d.ts.map