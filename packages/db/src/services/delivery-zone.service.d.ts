import type { DeliveryZone } from '../generated/client';
export interface CreateDeliveryZoneInput {
    storeId: string;
    name: string;
    polygonJson: unknown;
    baseFee: number;
    minOrder?: number;
    priority?: number;
}
export interface UpdateDeliveryZoneInput {
    name?: string;
    polygonJson?: unknown;
    baseFee?: number;
    minOrder?: number;
    isActive?: boolean;
    priority?: number;
}
export interface PointCoordinates {
    lat: number;
    lng: number;
}
export declare function createDeliveryZone(input: CreateDeliveryZoneInput): Promise<DeliveryZone>;
export declare function getDeliveryZone(zoneId: string): Promise<DeliveryZone | null>;
export declare function updateDeliveryZone(zoneId: string, input: UpdateDeliveryZoneInput): Promise<DeliveryZone>;
export declare function deleteDeliveryZone(zoneId: string): Promise<void>;
export declare function getStoreDeliveryZones(storeId: string): Promise<DeliveryZone[]>;
export declare function getActiveStoreDeliveryZones(storeId: string): Promise<DeliveryZone[]>;
export declare function findDeliveryZoneForAddress(storeId: string, coordinates: PointCoordinates): Promise<DeliveryZone | null>;
export declare function calculateDeliveryFee(storeId: string, coordinates: PointCoordinates, orderSubtotal: number): Promise<{
    zone: DeliveryZone | null;
    fee: number;
    canDeliver: boolean;
    reason?: string;
}>;
export declare function bulkUpdateZonePriorities(updates: Array<{
    zoneId: string;
    priority: number;
}>): Promise<void>;
//# sourceMappingURL=delivery-zone.service.d.ts.map