import type { ExtendedPrismaClient } from '../client.js';
import type { MediaItem } from './river.service.js';
export declare const riverIngestKey: {
    readonly store: (storeId: string) => string;
    readonly itemLive: (itemId: string) => string;
    readonly itemRestock: (itemId: string) => string;
};
export declare function firstStoreImageMedia(db: ExtendedPrismaClient, storeId: string): Promise<MediaItem[] | null>;
export declare function firstItemImageMedia(db: ExtendedPrismaClient, itemId: string): Promise<MediaItem[] | null>;
export declare function loadAutomationKeys(db: ExtendedPrismaClient): Promise<Set<string>>;
//# sourceMappingURL=river-ingest.helpers.d.ts.map