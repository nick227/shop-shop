type AffiliateSalesSummary = {
    revenue: number;
    orders: number;
    customers: number;
    averageOrderValue: number;
};
export type AffiliateSalesRow = {
    affiliateId: string;
    affiliateName: string;
    referralCode: string;
    website?: string | null;
    orders: number;
    revenue: number;
    customers: number;
    averageOrderValue: number;
    lastOrderAt: string | null;
};
export type AffiliateRecentOrder = {
    orderId: string;
    customerName?: string | null;
    total: number;
    affiliateName: string;
    referralCode: string;
    createdAt: string;
    status: string;
};
export declare function getStoreAffiliateSalesSummary(storeId: string): Promise<AffiliateSalesSummary>;
export declare function getStoreAffiliateSalesByAffiliate(storeId: string): Promise<AffiliateSalesRow[]>;
export declare function getStoreAffiliateRecentOrders(storeId: string, limit?: number): Promise<AffiliateRecentOrder[]>;
export {};
//# sourceMappingURL=affiliate-sales.service.d.ts.map