export interface ExportCommissionsOptions {
    startDate?: Date;
    endDate?: Date;
    affiliateId?: string;
    status?: 'PENDING' | 'APPROVED' | 'PAID' | 'REVERSED';
}
export interface ExportPayoutsOptions {
    startDate?: Date;
    endDate?: Date;
    status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}
export interface ExportOrdersOptions {
    startDate?: Date;
    endDate?: Date;
    storeId?: string;
    status?: 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELED';
}
export interface ExportTaxesOptions {
    startDate?: Date;
    endDate?: Date;
    storeId?: string;
}
/**
 * Export affiliate commissions to CSV
 */
export declare function exportCommissionsToCSV(options?: ExportCommissionsOptions): Promise<string>;
/**
 * Export affiliate payouts to CSV
 */
export declare function exportPayoutsToCSV(options?: ExportPayoutsOptions): Promise<string>;
/**
 * Export orders with financial breakdown to CSV
 */
export declare function exportOrdersToCSV(options?: ExportOrdersOptions): Promise<string>;
/**
 * Stream orders export for large datasets (memory-efficient)
 */
export declare function streamOrdersToCSV(options?: ExportOrdersOptions): AsyncGenerator<string>;
/**
 * Export tax summary by store to CSV
 */
export declare function exportTaxSummaryToCSV(options?: ExportTaxesOptions): Promise<string>;
/**
 * Export service fees summary to CSV
 */
export declare function exportServiceFeesToCSV(startDate?: Date, endDate?: Date): Promise<string>;
/**
 * Export complete financial summary (all fees breakdown)
 */
export declare function exportFinancialSummaryToCSV(startDate?: Date, endDate?: Date): Promise<string>;
/**
 * Export vendor payout summary
 */
export declare function exportVendorPayoutsToCSV(startDate?: Date, endDate?: Date): Promise<string>;
//# sourceMappingURL=accounting-export.service.d.ts.map