import { z } from 'zod';
export declare const CreateAddressInputSchema: z.ZodObject<Record<string, z.ZodTypeAny>, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
}, {
    [x: string]: any;
}>;
export declare const UpdateAddressInputSchema: z.ZodTypeAny;
export declare const AddressResponseSchema: z.ZodObject<Record<string, z.ZodTypeAny>, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
}, {
    [x: string]: any;
}>;
export declare const AddressListResponseSchema: z.ZodObject<Record<string, z.ZodTypeAny>, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
}, {
    [x: string]: any;
}>;
export type CreateAddressInput = z.infer<typeof CreateAddressInputSchema>;
export type UpdateAddressInput = z.infer<typeof UpdateAddressInputSchema>;
export type AddressResponse = z.infer<typeof AddressResponseSchema>;
export type AddressListResponse = z.infer<typeof AddressListResponseSchema>;
//# sourceMappingURL=address.dto.d.ts.map