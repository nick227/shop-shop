import { z } from 'zod';
export declare const CreateStoreInputSchema: z.ZodObject<Record<string, z.ZodTypeAny>, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
}, {
    [x: string]: any;
}>;
export declare const UpdateStoreInputSchema: z.ZodTypeAny;
export declare const StoreResponseSchema: z.ZodObject<Record<string, z.ZodTypeAny>, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
}, {
    [x: string]: any;
}>;
export declare const StoreListResponseSchema: z.ZodObject<Record<string, z.ZodTypeAny>, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
}, {
    [x: string]: any;
}>;
export declare const StoreQuerySchema: z.ZodTypeAny;
export declare const StoreWithDistanceSchema: z.ZodObject<{
    [x: string]: z.ZodTypeAny;
} & {
    distance: z.ZodOptional<z.ZodNumber>;
}, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
    distance?: unknown;
}, {
    [x: string]: any;
    distance?: unknown;
}>;
export type CreateStoreInput = z.infer<typeof CreateStoreInputSchema>;
export type UpdateStoreInput = z.infer<typeof UpdateStoreInputSchema>;
export type StoreResponse = z.infer<typeof StoreResponseSchema>;
export type StoreWithDistance = z.infer<typeof StoreWithDistanceSchema>;
export type StoreListResponse = z.infer<typeof StoreListResponseSchema>;
export type StoreQuery = z.infer<typeof StoreQuerySchema>;
//# sourceMappingURL=store.dto.d.ts.map