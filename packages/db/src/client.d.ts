export declare function createPrismaClient(): import("@packages/db/generated/client/runtime/library.js").DynamicClientExtensionThis<import("./index.js").Prisma.TypeMap<import("@packages/db/generated/client/runtime/library.js").InternalArgs & {
    result: {};
    model: {};
    query: {};
    client: {};
}, import("./index.js").Prisma.PrismaClientOptions>, import("./index.js").Prisma.TypeMapCb, {
    result: {};
    model: {};
    query: {};
    client: {};
}, {}>;
/** Use this for services that receive the shared `prisma` singleton (includes Order delivery-coords guard). */
export type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;
export declare const prisma: ExtendedPrismaClient;
export default prisma;
//# sourceMappingURL=client.d.ts.map