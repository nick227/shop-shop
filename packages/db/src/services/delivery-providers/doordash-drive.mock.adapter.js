/**
 * Mock/sandbox-shaped adapter for DoorDash Drive-like dispatch.
 * Does not call external APIs; returns stable fake IDs/URLs for dev/testing.
 */
export const doordashDriveMockAdapter = {
    provider: 'DOORDASH_DRIVE',
    async quoteDelivery(_input) {
        return {
            feeCents: 599,
            currency: 'USD',
            etaMinutes: 35,
            providerPayload: {
                sandbox: true,
                quote: { fee_cents: 599, eta_minutes: 35 },
            },
        };
    },
    async createDelivery(input) {
        const externalId = `dd_drive_sandbox_${input.deliveryJobId.slice(0, 8)}`;
        return {
            providerExternalId: externalId,
            trackingUrl: `https://sandbox.doordash.example/drive/track/${externalId}`,
            providerStatus: 'created',
            providerPayload: {
                sandbox: true,
                delivery_id: externalId,
                tracking_url: `https://sandbox.doordash.example/drive/track/${externalId}`,
            },
        };
    },
    async cancelDelivery(input) {
        return {
            providerStatus: 'canceled',
            providerPayload: {
                sandbox: true,
                delivery_id: input.providerExternalId ?? null,
                canceled: true,
            },
        };
    },
    async mapWebhookEvent(input) {
        const type = input.eventType.toLowerCase();
        if (type === 'picked_up' || type === 'dasher_picked_up' || type.startsWith('dasher_enroute')) {
            return { providerStatus: 'picked_up', mappedOrderStatus: 'OUT_FOR_DELIVERY', providerPayload: input.payload };
        }
        if (type === 'delivered' || type === 'dasher_dropped_off') {
            return { providerStatus: 'delivered', mappedOrderStatus: 'DELIVERED', providerPayload: input.payload };
        }
        if (type === 'canceled' || type === 'cancelled' || type === 'delivery_cancelled') {
            return { providerStatus: 'canceled', providerPayload: input.payload };
        }
        if (type === 'failed') {
            return { providerStatus: 'failed', providerPayload: input.payload };
        }
        return { providerStatus: `unhandled:${input.eventType}`, providerPayload: input.payload };
    },
};
