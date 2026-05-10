import { type UploadFile } from '../adapters/storage.adapter.js';
export interface UploadMediaInput {
    file: UploadFile;
    storeId?: string;
    itemId?: string;
    userId: string;
    userRole?: 'USER' | 'VENDOR' | 'ADMIN' | 'AFFILIATE' | 'RIDER' | 'STAFF';
    altText?: string;
    sortIndex?: number;
}
export interface UploadMediaResult {
    id: string;
    kind: 'IMAGE' | 'VIDEO';
    url: string;
    altText: string | null;
    sortIndex: number;
    size: number;
}
export declare const uploadMedia: (input: UploadMediaInput) => Promise<UploadMediaResult>;
export interface DeleteMediaInput {
    mediaId: string;
    userId: string;
    userRole?: 'USER' | 'VENDOR' | 'ADMIN' | 'AFFILIATE' | 'RIDER' | 'STAFF';
}
export declare const deleteMedia: (input: DeleteMediaInput) => Promise<void>;
export interface ListMediaInput {
    storeId?: string;
    itemId?: string;
    userId?: string;
}
export declare const listMedia: (input: ListMediaInput) => Promise<{
    id: string;
    createdAt: Date;
    storeId: string | null;
    sortIndex: number;
    url: string;
    kind: import("@packages/db/generated/client/index.js").$Enums.MediaKind;
    itemId: string | null;
    altText: string | null;
    metadata: import("@packages/db/generated/client/runtime/library.js").JsonValue | null;
    bundleId: string | null;
}[]>;
export interface UpdateMediaSortInput {
    mediaId: string;
    userId: string;
    userRole?: 'USER' | 'VENDOR' | 'ADMIN' | 'AFFILIATE' | 'RIDER' | 'STAFF';
    sortIndex: number;
}
export declare const updateMediaSort: (input: UpdateMediaSortInput) => Promise<void>;
export interface ReorderMediaInput {
    mediaIds: string[];
    userId: string;
    userRole?: 'USER' | 'VENDOR' | 'ADMIN' | 'AFFILIATE' | 'RIDER' | 'STAFF';
}
export declare const reorderMedia: (input: ReorderMediaInput) => Promise<void>;
//# sourceMappingURL=media.service.d.ts.map