import { z } from 'zod';
export declare const CreatePaymentIntentInputSchema: z.ZodObject<{
    orderId: z.ZodString;
    paymentMethodId: z.ZodOptional<z.ZodString>;
    savePaymentMethod: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    orderId: string;
    savePaymentMethod: boolean;
    paymentMethodId?: string | undefined;
}, {
    orderId: string;
    paymentMethodId?: string | undefined;
    savePaymentMethod?: boolean | undefined;
}>;
export declare const PaymentIntentResponseSchema: z.ZodObject<{
    clientSecret: z.ZodString;
    paymentIntentId: z.ZodString;
    amount: z.ZodNumber;
    status: z.ZodEnum<["requires_payment_method", "requires_confirmation", "requires_action", "processing", "succeeded", "canceled"]>;
}, "strip", z.ZodTypeAny, {
    status: "requires_payment_method" | "requires_confirmation" | "requires_action" | "processing" | "succeeded" | "canceled";
    amount: number;
    clientSecret: string;
    paymentIntentId: string;
}, {
    status: "requires_payment_method" | "requires_confirmation" | "requires_action" | "processing" | "succeeded" | "canceled";
    amount: number;
    clientSecret: string;
    paymentIntentId: string;
}>;
export declare const CreateConnectAccountInputSchema: z.ZodObject<{
    storeId: z.ZodString;
    businessType: z.ZodDefault<z.ZodEnum<["individual", "company"]>>;
    email: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    storeId: string;
    businessType: "individual" | "company";
    email?: string | undefined;
}, {
    storeId: string;
    email?: string | undefined;
    businessType?: "individual" | "company" | undefined;
}>;
export declare const ConnectAccountResponseSchema: z.ZodObject<{
    accountId: z.ZodString;
    onboardingUrl: z.ZodString;
}, "strip", z.ZodTypeAny, {
    accountId: string;
    onboardingUrl: string;
}, {
    accountId: string;
    onboardingUrl: string;
}>;
export declare const ConnectAccountStatusSchema: z.ZodObject<{
    accountId: z.ZodString;
    detailsSubmitted: z.ZodBoolean;
    chargesEnabled: z.ZodBoolean;
    payoutsEnabled: z.ZodBoolean;
    requirements: z.ZodOptional<z.ZodObject<{
        currentlyDue: z.ZodArray<z.ZodString, "many">;
        eventuallyDue: z.ZodArray<z.ZodString, "many">;
        pastDue: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        currentlyDue: string[];
        eventuallyDue: string[];
        pastDue: string[];
    }, {
        currentlyDue: string[];
        eventuallyDue: string[];
        pastDue: string[];
    }>>;
}, "strip", z.ZodTypeAny, {
    accountId: string;
    detailsSubmitted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    requirements?: {
        currentlyDue: string[];
        eventuallyDue: string[];
        pastDue: string[];
    } | undefined;
}, {
    accountId: string;
    detailsSubmitted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    requirements?: {
        currentlyDue: string[];
        eventuallyDue: string[];
        pastDue: string[];
    } | undefined;
}>;
export declare const StripeWebhookEventSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    type: string;
    id: string;
    data: Record<string, unknown>;
}, {
    type: string;
    id: string;
    data: Record<string, unknown>;
}>;
export declare const PaymentMethodResponseSchema: z.ZodObject<{
    id: z.ZodString;
    provider: z.ZodEnum<["TEST", "STRIPE", "SQUARE"]>;
    brand: z.ZodNullable<z.ZodString>;
    last4: z.ZodNullable<z.ZodString>;
    isDefault: z.ZodBoolean;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    isDefault: boolean;
    provider: "TEST" | "STRIPE" | "SQUARE";
    brand: string | null;
    last4: string | null;
}, {
    id: string;
    createdAt: string;
    isDefault: boolean;
    provider: "TEST" | "STRIPE" | "SQUARE";
    brand: string | null;
    last4: string | null;
}>;
export declare const PaymentMethodListResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        provider: z.ZodEnum<["TEST", "STRIPE", "SQUARE"]>;
        brand: z.ZodNullable<z.ZodString>;
        last4: z.ZodNullable<z.ZodString>;
        isDefault: z.ZodBoolean;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        isDefault: boolean;
        provider: "TEST" | "STRIPE" | "SQUARE";
        brand: string | null;
        last4: string | null;
    }, {
        id: string;
        createdAt: string;
        isDefault: boolean;
        provider: "TEST" | "STRIPE" | "SQUARE";
        brand: string | null;
        last4: string | null;
    }>, "many">;
    total: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    total: number;
    data: {
        id: string;
        createdAt: string;
        isDefault: boolean;
        provider: "TEST" | "STRIPE" | "SQUARE";
        brand: string | null;
        last4: string | null;
    }[];
}, {
    total: number;
    data: {
        id: string;
        createdAt: string;
        isDefault: boolean;
        provider: "TEST" | "STRIPE" | "SQUARE";
        brand: string | null;
        last4: string | null;
    }[];
}>;
export type CreatePaymentIntentInput = z.infer<typeof CreatePaymentIntentInputSchema>;
export type PaymentIntentResponse = z.infer<typeof PaymentIntentResponseSchema>;
export type CreateConnectAccountInput = z.infer<typeof CreateConnectAccountInputSchema>;
export type ConnectAccountResponse = z.infer<typeof ConnectAccountResponseSchema>;
export type ConnectAccountStatus = z.infer<typeof ConnectAccountStatusSchema>;
export type StripeWebhookEvent = z.infer<typeof StripeWebhookEventSchema>;
export type PaymentMethodResponse = z.infer<typeof PaymentMethodResponseSchema>;
export type PaymentMethodListResponse = z.infer<typeof PaymentMethodListResponseSchema>;
//# sourceMappingURL=payment.dto.d.ts.map