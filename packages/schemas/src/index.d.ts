import { z } from 'zod';
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
export declare const registry: OpenAPIRegistry;
export declare const ErrorResponseSchema: z.ZodObject<{
    error: z.ZodString;
    message: z.ZodOptional<z.ZodString>;
    issues: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
}, "strip", z.ZodTypeAny, {
    error: string;
    issues?: any[] | undefined;
    message?: string | undefined;
}, {
    error: string;
    issues?: any[] | undefined;
    message?: string | undefined;
}>;
export declare const PaginationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: string | undefined;
    limit?: string | undefined;
}>;
export * from './core/index.js';
export * from './dtos/index.js';
export { StoreResponseSchema, StoreListResponseSchema, StoreWithDistanceSchema } from './dtos/store.dto.js';
export { ItemResponseSchema, ItemListResponseSchema } from './dtos/item.dto.js';
export { OrderResponseSchema, OrderListResponseSchema } from './dtos/order.dto.js';
export { CartResponseSchema } from './dtos/cart.dto.js';
export { AddressResponseSchema } from './dtos/address.dto.js';
export { registerAllResourcesInOpenAPI } from './core/openapi.loader.js';
//# sourceMappingURL=index.d.ts.map