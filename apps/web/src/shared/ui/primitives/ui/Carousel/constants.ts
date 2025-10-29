/**
 * Carousel System Constants;
 * Centralized configuration for all carousel components;
 */

// Scroll behavior;
export const SCROLL_AMOUNT_MULTIPLIER = 0.8;
export const SCROLL_THRESHOLD_PX = 10;
export const SWIPE_THRESHOLD_PX = 50;
// Aspect ratios;
export const ASPECT_RATIO = {
  SQUARE: '1/1',
  PORTRAIT: '3/4',
  LANDSCAPE: '4/3',
  WIDE: '16/9',
  ULTRA_WIDE: '21/9'} as const;
// Navigation symbols;
export const NAV_SYMBOL = {
  LEFT: '‹',
  RIGHT: '›',
  UP: '↑',
  DOWN: '↓',
  CLOSE: '✕'} as const;
// Icons;
export const ICON = {
  LOCATION: '📍',
  TIME: '🕐',
  STAR: '⭐',
  DELIVERY: '🚚',
  MONEY: '💰',
  STORE: '🏪'} as const;
// Scroll directions;
export const SCROLL_DIRECTION = {
  LEFT: 'left',
  RIGHT: 'right',
  UP: 'up',
  DOWN: 'down'} as const;
export type ScrollDirection = typeof SCROLL_DIRECTION[keyof typeof SCROLL_DIRECTION]

// Aria labels;
export const ARIA_LABEL = {
  SCROLL_LEFT: 'Scroll left',
  SCROLL_RIGHT: 'Scroll right',
  SCROLL_UP: 'Scroll up',
  SCROLL_DOWN: 'Scroll down',
  CLOSE_CAROUSEL: 'Close carousel',
  PREVIOUS_ITEM: 'Previous item',
  NEXT_ITEM: 'Next item',
  GO_TO_ITEM: (index: number) => 'Go to item ' + index + 1 + '',
  VIEW_STORE: (name: string) => 'View ' + name + ''} as const;
// Text labels;
export const LABEL = {
  DISTANCE: 'Distance',
  PREP_TIME: 'Prep Time',
  DELIVERY: 'Delivery',
  MIN_ORDER: 'Min Order',
  FEATURED: 'Featured',
  SOLD_OUT: 'Sold Out',
  VIEW_MENU: 'View Menu',
  STORE_DETAILS: 'Store Details'} as const;
// Placeholder image prefixes;
export const PLACEHOLDER_PREFIX = {
  ITEM: '/placeholder-item-',
  STORE: '/placeholder-store-',
  PRODUCT: '/placeholder-product-'} as const;
// Time suffix;
export const TIME_SUFFIX = 'm' as const;