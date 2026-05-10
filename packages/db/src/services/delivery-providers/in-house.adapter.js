export const inHouseDeliveryAdapter = {
    provider: 'IN_HOUSE',
    async quoteDelivery(_input) {
        return {
            feeCents: 0,
            currency: 'USD',
            providerPayload: { mode: 'in_house' },
        };
    },
    async createDelivery(_input) {
        return {
            providerStatus: 'created',
            providerPayload: { mode: 'in_house' },
        };
    },
    async cancelDelivery(_input) {
        return {
            providerStatus: 'canceled',
            providerPayload: { mode: 'in_house' },
        };
    },
    async mapWebhookEvent(input) {
        return {
            providerStatus: `unhandled:${input.eventType}`,
            providerPayload: input.payload,
        };
    },
};
