export interface BaseServiceConfig {
    model: string;
}
export interface FindManyParams {
    where?: Record<string, unknown>;
    skip?: number;
    take?: number;
    orderBy?: Record<string, unknown>;
    include?: Record<string, unknown>;
}
export interface ListResult<T> {
    data: T[];
    total: number;
}
export declare class BaseCrudService<T = unknown> {
    protected config: BaseServiceConfig;
    protected modelDelegate: {
        create: (args: {
            data: unknown;
        }) => Promise<T>;
        findUnique: (args: {
            where: {
                id: string;
            };
            include?: Record<string, unknown>;
        }) => Promise<T | null>;
        findMany: (args: {
            where?: unknown;
            skip?: number;
            take?: number;
            orderBy?: unknown;
            include?: unknown;
        }) => Promise<T[]>;
        count: (args: {
            where?: unknown;
        }) => Promise<number>;
        update: (args: {
            where: {
                id: string;
            };
            data: unknown;
        }) => Promise<T>;
        delete: (args: {
            where: {
                id: string;
            };
        }) => Promise<void>;
    };
    constructor(config: BaseServiceConfig);
    create(data: unknown): Promise<T>;
    findById(id: string, include?: Record<string, unknown>): Promise<T | null>;
    findMany(params: FindManyParams): Promise<ListResult<T>>;
    update(id: string, data: unknown): Promise<T>;
    delete(id: string): Promise<void>;
    /**
     * Check if user owns/can access a resource
     * @param userId - User ID to check
     * @param resourceId - Resource ID
     * @param relationPath - Path to owner field (e.g., 'ownerUserId' or 'store.ownerUserId')
     */
    canUserAccess(userId: string, resourceId: string, relationPath?: string): Promise<boolean>;
    private getIncludeFromPath;
    private getValueFromPath;
}
//# sourceMappingURL=base.service.d.ts.map