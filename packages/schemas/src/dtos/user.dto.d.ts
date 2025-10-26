import { z } from 'zod';
export declare const UpdateUserProfileInputSchema: z.ZodTypeAny;
export declare const UserResponseSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
    role: z.ZodEnum<["USER", "VENDOR", "ADMIN"]>;
    phone: z.ZodNullable<z.ZodString>;
    isCompany: z.ZodBoolean;
    companyName: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string | null;
    id: string;
    role: "USER" | "VENDOR" | "ADMIN";
    email: string;
    phone: string | null;
    isCompany: boolean;
    companyName: string | null;
    createdAt: string;
}, {
    name: string | null;
    id: string;
    role: "USER" | "VENDOR" | "ADMIN";
    email: string;
    phone: string | null;
    isCompany: boolean;
    companyName: string | null;
    createdAt: string;
}>;
export declare const UserListResponseSchema: z.ZodObject<Record<string, z.ZodTypeAny>, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
}, {
    [x: string]: any;
}>;
export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileInputSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UserListResponse = z.infer<typeof UserListResponseSchema>;
//# sourceMappingURL=user.dto.d.ts.map