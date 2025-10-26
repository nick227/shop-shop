import type { ZodSchema } from 'zod';
export type CrudOperation = 'create' | 'read' | 'update' | 'delete' | 'list';
export type Role = 'USER' | 'VENDOR' | 'ADMIN';
export interface ResourceSchemas {
    create?: ZodSchema;
    update?: ZodSchema;
    response: ZodSchema;
    list: ZodSchema;
    query?: ZodSchema;
}
export interface AccessControl {
    create?: Role[];
    read?: Role[];
    update?: Role[];
    delete?: Role[];
    list?: Role[];
}
export interface OwnershipCheck {
    enabled: boolean;
    relationPath?: string;
}
export interface CustomHooks {
    beforeCreate?: (data: unknown, context?: HookContext) => Promise<unknown>;
    afterCreate?: (result: unknown, context?: HookContext) => Promise<void>;
    beforeRead?: (id: string, context?: HookContext) => Promise<void>;
    afterRead?: (result: unknown, context?: HookContext) => Promise<unknown>;
    beforeUpdate?: (id: string, data: unknown, context?: HookContext) => Promise<unknown>;
    afterUpdate?: (result: unknown, context?: HookContext) => Promise<void>;
    beforeDelete?: (id: string, context?: HookContext) => Promise<void>;
    afterDelete?: (id: string, context?: HookContext) => Promise<void>;
    beforeList?: (filters: unknown, context?: HookContext) => Promise<unknown>;
    afterList?: (result: unknown, context?: HookContext) => Promise<unknown>;
}
export interface HookContext {
    userId?: string;
    userRole?: Role;
}
export interface ResourceDefinition {
    name: string;
    model: string;
    path: string;
    schemas: ResourceSchemas;
    access: AccessControl;
    ownership?: OwnershipCheck;
    operations: CrudOperation[];
    customHooks?: CustomHooks;
}
export interface ResourceOperations {
    hasCreate: boolean;
    hasRead: boolean;
    hasUpdate: boolean;
    hasDelete: boolean;
    hasList: boolean;
}
export interface ListParams {
    page?: number;
    limit?: number;
    filters?: Record<string, unknown>;
    orderBy?: Record<string, unknown>;
}
export interface ListResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}
//# sourceMappingURL=types.d.ts.map