import { createPost, RiverAutomationRejected } from './river.service.js';
import { firstItemImageMedia, firstStoreImageMedia, loadAutomationKeys, riverIngestKey, } from './river-ingest.helpers.js';
const emptyResult = () => ({
    created: 0,
    skippedExisting: 0,
    skippedNoMedia: 0,
    skippedCooldown: 0,
    errors: 0,
});
function mergeResult(a, b) {
    return {
        created: a.created + (b.created ?? 0),
        skippedExisting: a.skippedExisting + (b.skippedExisting ?? 0),
        skippedNoMedia: a.skippedNoMedia + (b.skippedNoMedia ?? 0),
        skippedCooldown: a.skippedCooldown + (b.skippedCooldown ?? 0),
        errors: a.errors + (b.errors ?? 0),
    };
}
/**
 * Stateless River ingest: published stores, new items (with media), optional restock.
 * See `RIVER_INGESTION_WORKER_PROPOSAL.md`.
 */
export async function runRiverIngestion(db, options) {
    const enableRestock = options?.enableRestock ?? process.env.RIVER_INGEST_RESTOCK === 'true';
    let r = emptyResult();
    const keys = await loadAutomationKeys(db);
    const publishedStores = await db.store.findMany({
        where: { isPublished: true },
        select: { id: true, name: true, description: true },
    });
    for (const s of publishedStores) {
        const k = riverIngestKey.store(s.id);
        if (keys.has(k)) {
            r = mergeResult(r, { skippedExisting: 1 });
            continue;
        }
        const media = await firstStoreImageMedia(db, s.id);
        if (!media?.length) {
            r = mergeResult(r, { skippedNoMedia: 1 });
            continue;
        }
        const content = s.description?.trim()
            ? `${s.name} — ${s.description.trim().slice(0, 280)}`
            : `Welcome to ${s.name}!`;
        try {
            await createPost({
                storeId: s.id,
                content,
                mediaUrls: media,
                source: 'AUTO_STORE',
                automationKey: k,
            });
            keys.add(k);
            r = mergeResult(r, { created: 1 });
        }
        catch (e) {
            if (e instanceof RiverAutomationRejected) {
                r = mergeResult(r, { skippedCooldown: 1 });
            }
            else {
                r = mergeResult(r, { errors: 1 });
            }
        }
    }
    const items = await db.item.findMany({
        where: { isActive: true, store: { isPublished: true } },
        select: { id: true, storeId: true, title: true },
    });
    for (const it of items) {
        const k = riverIngestKey.itemLive(it.id);
        if (keys.has(k)) {
            r = mergeResult(r, { skippedExisting: 1 });
            continue;
        }
        const media = await firstItemImageMedia(db, it.id);
        if (!media?.length) {
            r = mergeResult(r, { skippedNoMedia: 1 });
            continue;
        }
        try {
            await createPost({
                storeId: it.storeId,
                content: `New: ${it.title}`,
                mediaUrls: media,
                source: 'AUTO_PRODUCT',
                automationKey: k,
                linkedItemId: it.id,
            });
            keys.add(k);
            r = mergeResult(r, { created: 1 });
        }
        catch (e) {
            if (e instanceof RiverAutomationRejected) {
                r = mergeResult(r, { skippedCooldown: 1 });
            }
            else {
                r = mergeResult(r, { errors: 1 });
            }
        }
    }
    if (enableRestock) {
        const restockCandidates = await db.item.findMany({
            where: {
                isActive: true,
                isSoldOut: false,
                store: { isPublished: true },
            },
            select: { id: true, storeId: true, title: true, updatedAt: true },
        });
        for (const it of restockCandidates) {
            const kRestock = riverIngestKey.itemRestock(it.id);
            const kLive = riverIngestKey.itemLive(it.id);
            if (keys.has(kRestock)) {
                r = mergeResult(r, { skippedExisting: 1 });
                continue;
            }
            if (!keys.has(kLive)) {
                r = mergeResult(r, { skippedExisting: 1 });
                continue;
            }
            const livePost = await db.post.findUnique({
                where: { automationKey: kLive },
                select: { createdAt: true },
            });
            if (!livePost || it.updatedAt <= livePost.createdAt) {
                r = mergeResult(r, { skippedExisting: 1 });
                continue;
            }
            const media = await firstItemImageMedia(db, it.id);
            if (!media?.length) {
                r = mergeResult(r, { skippedNoMedia: 1 });
                continue;
            }
            try {
                await createPost({
                    storeId: it.storeId,
                    content: `Back in stock: ${it.title}`,
                    mediaUrls: media,
                    source: 'AUTO_PRODUCT',
                    automationKey: kRestock,
                    linkedItemId: it.id,
                });
                keys.add(kRestock);
                r = mergeResult(r, { created: 1 });
            }
            catch (e) {
                if (e instanceof RiverAutomationRejected) {
                    r = mergeResult(r, { skippedCooldown: 1 });
                }
                else {
                    r = mergeResult(r, { errors: 1 });
                }
            }
        }
    }
    return r;
}
