/**
 * What checkout can fulfill today. The storefront reads the same switch, so it never advertises a way
 * to order that checkout would turn away.
 *
 * Delivery checkout waits on address management; until it ships, orders are pickup only.
 */
export const DELIVERY_AT_CHECKOUT = false
