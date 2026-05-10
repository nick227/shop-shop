export const riverIngestKey = {
    store: (storeId) => `auto_store:${storeId}`,
    itemLive: (itemId) => `item_live:${itemId}`,
    itemRestock: (itemId) => `item_restock:${itemId}`,
};
function mediaRowToItem(row) {
    const type = row.kind === 'VIDEO' ? 'video' : 'image';
    return { type, url: row.url };
}
export async function firstStoreImageMedia(db, storeId) {
    const row = await db.mediaAsset.findFirst({
        where: { storeId, kind: { in: ['IMAGE', 'VIDEO'] } },
        orderBy: { sortIndex: 'asc' },
        select: { kind: true, url: true },
    });
    if (!row)
        return null;
    return [mediaRowToItem(row)];
}
export async function firstItemImageMedia(db, itemId) {
    const row = await db.mediaAsset.findFirst({
        where: { itemId, kind: { in: ['IMAGE', 'VIDEO'] } },
        orderBy: { sortIndex: 'asc' },
        select: { kind: true, url: true },
    });
    if (!row)
        return null;
    return [mediaRowToItem(row)];
}
export async function loadAutomationKeys(db) {
    const rows = await db.post.findMany({
        where: { automationKey: { not: null } },
        select: { automationKey: true },
    });
    return new Set(rows.map((r) => r.automationKey).filter((k) => typeof k === 'string' && k.length > 0));
}
