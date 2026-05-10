import { Prisma } from './generated/client/index.js';
function assertDeliveryHasCoordinates(data) {
    if (data.deliveryType !== 'DELIVERY')
        return;
    const lat = data.deliveryLatitude;
    const lng = data.deliveryLongitude;
    if (lat === undefined || lat === null || lng === undefined || lng === null) {
        throw new Error('Delivery requires coordinates');
    }
}
/**
 * Blocks `Order` rows with DELIVERY and missing delivery lat/lng (any code path using Prisma).
 */
export const orderDeliveryCoordsGuard = Prisma.defineExtension({
    name: 'orderDeliveryCoordsGuard',
    query: {
        order: {
            create({ args, query }) {
                assertDeliveryHasCoordinates(args.data);
                return query(args);
            },
            createMany({ args, query }) {
                const batch = Array.isArray(args.data) ? args.data : [args.data];
                for (const row of batch) {
                    assertDeliveryHasCoordinates(row);
                }
                return query(args);
            },
        },
    },
});
