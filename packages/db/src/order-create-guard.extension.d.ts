/**
 * Blocks `Order` rows with DELIVERY and missing delivery lat/lng (any code path using Prisma).
 */
export declare const orderDeliveryCoordsGuard: (client: any) => {
    $extends: {
        extArgs: import("@packages/db/generated/client/runtime/library.js").InternalArgs<unknown, unknown, {}, unknown>;
    };
};
//# sourceMappingURL=order-create-guard.extension.d.ts.map