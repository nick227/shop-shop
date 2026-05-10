import { z } from 'zod';
export declare const SignupInputSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    affiliateReferralCode: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    name?: string | undefined;
    phone?: string | undefined;
    affiliateReferralCode?: string | undefined;
}, {
    password: string;
    email: string;
    name?: string | undefined;
    phone?: string | undefined;
    affiliateReferralCode?: string | undefined;
}>;
export declare const LoginInputSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
}, {
    password: string;
    email: string;
}>;
export declare const UserPublicResponseSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
    role: z.ZodEnum<["USER", "VENDOR_PENDING", "VENDOR", "ADMIN", "AFFILIATE", "RIDER", "STAFF"]>;
    phone: z.ZodNullable<z.ZodString>;
    isCompany: z.ZodBoolean;
    companyName: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string | null;
    id: string;
    createdAt: string;
    role: "USER" | "VENDOR_PENDING" | "VENDOR" | "ADMIN" | "AFFILIATE" | "RIDER" | "STAFF";
    email: string;
    phone: string | null;
    isCompany: boolean;
    companyName: string | null;
}, {
    name: string | null;
    id: string;
    createdAt: string;
    role: "USER" | "VENDOR_PENDING" | "VENDOR" | "ADMIN" | "AFFILIATE" | "RIDER" | "STAFF";
    email: string;
    phone: string | null;
    isCompany: boolean;
    companyName: string | null;
}>;
export declare const AuthResponseSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
        role: z.ZodEnum<["USER", "VENDOR_PENDING", "VENDOR", "ADMIN", "AFFILIATE", "RIDER", "STAFF"]>;
        phone: z.ZodNullable<z.ZodString>;
        isCompany: z.ZodBoolean;
        companyName: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string | null;
        id: string;
        createdAt: string;
        role: "USER" | "VENDOR_PENDING" | "VENDOR" | "ADMIN" | "AFFILIATE" | "RIDER" | "STAFF";
        email: string;
        phone: string | null;
        isCompany: boolean;
        companyName: string | null;
    }, {
        name: string | null;
        id: string;
        createdAt: string;
        role: "USER" | "VENDOR_PENDING" | "VENDOR" | "ADMIN" | "AFFILIATE" | "RIDER" | "STAFF";
        email: string;
        phone: string | null;
        isCompany: boolean;
        companyName: string | null;
    }>;
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    user: {
        name: string | null;
        id: string;
        createdAt: string;
        role: "USER" | "VENDOR_PENDING" | "VENDOR" | "ADMIN" | "AFFILIATE" | "RIDER" | "STAFF";
        email: string;
        phone: string | null;
        isCompany: boolean;
        companyName: string | null;
    };
    token: string;
}, {
    user: {
        name: string | null;
        id: string;
        createdAt: string;
        role: "USER" | "VENDOR_PENDING" | "VENDOR" | "ADMIN" | "AFFILIATE" | "RIDER" | "STAFF";
        email: string;
        phone: string | null;
        isCompany: boolean;
        companyName: string | null;
    };
    token: string;
}>;
export type SignupInput = z.infer<typeof SignupInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type UserPublicResponse = z.infer<typeof UserPublicResponseSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
//# sourceMappingURL=auth.dto.d.ts.map