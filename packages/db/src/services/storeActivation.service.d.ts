export interface StoreActivationRequirements {
    hasRequiredFields: boolean;
    hasMedia: boolean;
    hasActiveProducts: boolean;
    isNotDisabled: boolean;
    canAppearInMarketplace: boolean;
}
export declare const checkStoreActivationRequirements: (storeId: string) => Promise<StoreActivationRequirements>;
export interface ProductActivationRequirements {
    hasRequiredFields: boolean;
    hasMedia: boolean;
    isActive: boolean;
    parentStorePublic: boolean;
    canAppearPublicly: boolean;
}
export declare const checkProductActivationRequirements: (productId: string) => Promise<ProductActivationRequirements>;
export interface BundleActivationRequirements {
    hasRequiredFields: boolean;
    hasMedia: boolean;
    hasActiveItems: boolean;
    isActive: boolean;
    parentStorePublic: boolean;
    canAppearPublicly: boolean;
}
export declare const checkBundleActivationRequirements: (bundleId: string) => Promise<BundleActivationRequirements>;
//# sourceMappingURL=storeActivation.service.d.ts.map