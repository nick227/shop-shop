import { Decimal } from 'decimal.js';
/** Prisma include shared by placement validation and totals (single source of truth). */
export const CHECKOUT_CART_INCLUDE = {
    items: {
        include: {
            item: true,
            bundle: {
                include: {
                    items: {
                        include: {
                            item: { select: { id: true, title: true, price: true, isActive: true, isSoldOut: true } },
                        },
                    },
                    pricing: true,
                },
            },
        },
    },
    store: {
        select: {
            id: true,
            isPublished: true,
            commissionRate: true,
            deliveryCharge: true,
            latitude: true,
            longitude: true,
        },
    },
};
const cents = (value) => Math.round(value * 100) / 100;
export function placementFailureReason(cart, userId) {
    if (!cart) {
        return 'Cart not found';
    }
    if (cart.userId !== userId) {
        return 'Not your cart';
    }
    if (cart.status !== 'ACTIVE') {
        return 'Cart is not active';
    }
    if (cart.items.length === 0) {
        return 'Cart is empty';
    }
    const unavailable = [];
    for (const ci of cart.items) {
        if (ci.bundleId) {
            if (!ci.bundle) {
                unavailable.push(ci.titleSnapshot);
                continue;
            }
            if (!ci.bundle.items.every((bi) => bi.item.isActive && !bi.item.isSoldOut)) {
                unavailable.push(ci.titleSnapshot);
            }
        }
        else if (ci.item) {
            if (!ci.item.isActive || ci.item.isSoldOut)
                unavailable.push(ci.titleSnapshot);
        }
        else {
            unavailable.push(ci.titleSnapshot);
        }
    }
    if (unavailable.length > 0) {
        return `Items unavailable: ${unavailable.join(', ')}`;
    }
    if (!cart.store.isPublished) {
        return 'Store is not currently accepting orders';
    }
    return null;
}
/** Pure: money lines from an already-validated cart row. */
export function computeCheckoutTotals(cart, deliveryType, tipAmount, config, overrides = {}) {
    let subtotalNum = 0;
    for (const cartItem of cart.items) {
        const itemPrice = Number.parseFloat(cartItem.unitPrice.toString());
        subtotalNum += itemPrice * cartItem.quantity;
    }
    subtotalNum = cents(subtotalNum);
    let feesNum = 0;
    if (deliveryType === 'DELIVERY') {
        feesNum =
            overrides.deliveryFee ??
                (cart.store.deliveryCharge ? Number.parseFloat(cart.store.deliveryCharge.toString()) : config.defaultDeliveryFee);
    }
    feesNum = cents(feesNum);
    const taxNum = cents(overrides.tax ?? subtotalNum * config.taxRate);
    const tipNum = cents(Math.max(0, tipAmount));
    // Shopper service fee: an explicit platform policy on the subtotal (not on tax or tip).
    const servicePercent = config.shopperServiceFeePercent ?? 0;
    let serviceFeeNum = subtotalNum * (servicePercent / 100);
    if (subtotalNum > 0 && config.shopperServiceFeeMinimum !== undefined)
        serviceFeeNum = Math.max(serviceFeeNum, config.shopperServiceFeeMinimum);
    if (config.shopperServiceFeeMaximum !== undefined)
        serviceFeeNum = Math.min(serviceFeeNum, config.shopperServiceFeeMaximum);
    serviceFeeNum = cents(serviceFeeNum);
    const totalNum = cents(subtotalNum + feesNum + taxNum + tipNum + serviceFeeNum);
    // Vendor commission: the store's rate (or the platform default) on the subtotal, paid by the vendor.
    const commissionPercent = cart.store.commissionRate
        ? Number.parseFloat(cart.store.commissionRate.toString())
        : config.platformFeePercent;
    const commissionNum = cents(subtotalNum * (commissionPercent / 100));
    const netToVendorNum = cents(totalNum - serviceFeeNum - commissionNum);
    return {
        subtotal: new Decimal(subtotalNum.toFixed(2)),
        fees: new Decimal(feesNum.toFixed(2)),
        tax: new Decimal(taxNum.toFixed(2)),
        tip: new Decimal(tipNum.toFixed(2)),
        total: new Decimal(totalNum.toFixed(2)),
        serviceFeePercent: new Decimal(servicePercent.toFixed(2)),
        serviceFeeAmount: new Decimal(serviceFeeNum.toFixed(2)),
        vendorCommissionPercent: new Decimal(commissionPercent.toFixed(2)),
        vendorCommissionAmount: new Decimal(commissionNum.toFixed(2)),
        netToVendor: new Decimal(netToVendorNum.toFixed(2)),
        storeId: cart.store.id,
        storeLatitude: cart.store.latitude != null ? Number(cart.store.latitude) : null,
        storeLongitude: cart.store.longitude != null ? Number(cart.store.longitude) : null,
    };
}
