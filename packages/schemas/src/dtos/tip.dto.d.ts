import { z } from 'zod';
export declare const CreateTipInputSchema: z.ZodObject<{
    orderId: z.ZodString;
    amount: z.ZodEffects<z.ZodNumber, number, number>;
}, "strip", z.ZodTypeAny, {
    orderId: string;
    amount: number;
}, {
    orderId: string;
    amount: number;
}>;
export declare const TipResponseSchema: z.ZodObject<{
    id: z.ZodString;
    orderId: z.ZodString;
    amount: z.ZodNumber;
    status: z.ZodEnum<["PENDING", "PAID", "FAILED", "REFUNDED"]>;
    stripePaymentIntentId: z.ZodNullable<z.ZodString>;
    stripeChargeId: z.ZodNullable<z.ZodString>;
    stripeTransferId: z.ZodNullable<z.ZodString>;
    stripeApplicationFeeId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "PAID" | "REFUNDED" | "PENDING" | "FAILED";
    id: string;
    createdAt: string;
    updatedAt: string;
    orderId: string;
    amount: number;
    stripePaymentIntentId: string | null;
    stripeChargeId: string | null;
    stripeTransferId: string | null;
    stripeApplicationFeeId: string | null;
}, {
    status: "PAID" | "REFUNDED" | "PENDING" | "FAILED";
    id: string;
    createdAt: string;
    updatedAt: string;
    orderId: string;
    amount: number;
    stripePaymentIntentId: string | null;
    stripeChargeId: string | null;
    stripeTransferId: string | null;
    stripeApplicationFeeId: string | null;
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
export type TipResponse = z.infer<typeof TipResponseSchema>;
export type ProcessTipInput = z.infer<typeof ProcessTipInputSchema>;
export type TipStatusUpdate = z.infer<typeof TipStatusUpdateSchema>;
//# sourceMappingURL=tip.dto.d.ts.map