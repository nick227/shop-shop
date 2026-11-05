/**
 * What checkout can fulfill today. The storefront reads the same switch, so it never advertises a way
 * to order that checkout would turn away.
 *
 * Delivery checkout takes an address and checks the store's delivery area before payment.
 */
export const DELIVERY_AT_CHECKOUT = true
