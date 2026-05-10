import type { ExtendedPrismaClient } from '../client.js';
export type RiverFeedNear = Readonly<{
    lat: number;
    lng: number;
    radiusMiles: number;
}>;
export type RiverFeedCursor = Readonly<{
    p: number;
    t: string;
    id: string;
}>;
/**
 * Standard River feed ordering when geo is off (MySQL-safe media filter via JSON_LENGTH).
 */
export declare function queryRiverFeedIdsStandard(prisma: ExtendedPrismaClient, args: Readonly<{
    take: number;
    cursor?: RiverFeedCursor;
    storeId?: string;
    requireMedia: boolean;
}>): Promise<string[]>;
/**
 * Ordered post ids for the River feed when geo filter is active (Haversine in SQL).
 * Requires Store.latitude/longitude; only joins published stores.
 */
export declare function queryRiverFeedIdsWithGeo(prisma: ExtendedPrismaClient, args: Readonly<{
    take: number;
    cursor?: RiverFeedCursor;
    storeId?: string;
    near: RiverFeedNear;
    requireMedia: boolean;
}>): Promise<string[]>;
//# sourceMappingURL=river-feed-query.d.ts.map