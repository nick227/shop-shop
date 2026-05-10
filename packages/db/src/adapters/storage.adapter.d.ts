export interface StorageAdapter {
    upload(file: UploadFile): Promise<UploadResult>;
    delete(key: string): Promise<void>;
    getUrl(key: string): Promise<string>;
    exists(key: string): Promise<boolean>;
}
export interface UploadFile {
    filename: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
    folder?: string;
}
export interface UploadResult {
    key: string;
    url: string;
    size: number;
    mimetype: string;
}
export declare const getStorageAdapter: () => StorageAdapter;
export declare const ALLOWED_IMAGE_TYPES: string[];
export declare const ALLOWED_VIDEO_TYPES: string[];
export declare const MAX_IMAGE_SIZE: number;
export declare const MAX_VIDEO_SIZE: number;
export interface ValidationResult {
    valid: boolean;
    error?: string;
}
export declare const validateImageFile: (mimetype: string, size: number) => ValidationResult;
export declare const validateVideoFile: (mimetype: string, size: number) => ValidationResult;
export declare const validateMediaFile: (mimetype: string, size: number) => ValidationResult;
//# sourceMappingURL=storage.adapter.d.ts.map