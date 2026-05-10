import type { ExtendedPrismaClient } from '../client.js';
import type { RiverIngestResult } from './river-ingest.types.js';
/**
 * Stateless River ingest: published stores, new items (with media), optional restock.
 * See `RIVER_INGESTION_WORKER_PROPOSAL.md`.
 */
export declare function runRiverIngestion(db: ExtendedPrismaClient, options?: Readonly<{
    enableRestock?: boolean;
}>): Promise<RiverIngestResult>;
//# sourceMappingURL=river-ingest.runner.d.ts.map