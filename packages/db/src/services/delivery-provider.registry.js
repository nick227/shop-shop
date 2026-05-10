import { doordashDriveMockAdapter, inHouseDeliveryAdapter, uberDirectMockAdapter } from './delivery-providers/index.js';
/** Sandbox-shaped adapter only — real DoorDash HTTP lives outside `@packages/db` until wired without importing `apps/server`. */
const ADAPTERS = {
    IN_HOUSE: inHouseDeliveryAdapter,
    DOORDASH_DRIVE: doordashDriveMockAdapter,
    UBER_DIRECT: uberDirectMockAdapter,
};
export function getDeliveryProviderAdapter(provider) {
    return ADAPTERS[provider];
}
