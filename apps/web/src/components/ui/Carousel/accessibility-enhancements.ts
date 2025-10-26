/**
 * Accessibility Enhancement Utilities for Carousel;
 * Implement these helpers to achieve WCAG 2.1 AA compliance;
 */

/**
 * Check if user prefers reduced motion;
 * Use this to disable animations for vestibular disorders;
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get scroll behavior based on user preferences;
 * Returns 'auto' if reduced motion is preferred, 'smooth' otherwise;
 */
export function getScrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'auto' : 'smooth'
}

/**
 * Keyboard navigation handler for carousels;
 * Implements WCAG 2.1 keyboard navigation patterns;
 * 
 * @param element - Scrollable element;
 * @param scrollLeft - Callback to scroll left;
 * @param scrollRight - Callback to scroll right;
 * @param isVertical - Whether carousel is vertical;
 * @returns Cleanup function;
 */
export function setupKeyboardNavigation(
  element: HTMLElement,
  scrollLeft: () => void,
  scrollRight: () => void,
  isVertical = false
): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Only handle if element has focus;
    if (document.activeElement !== element) return;
    const key = e.key;
    const isHorizontalKey = key === 'ArrowLeft' || key === 'ArrowRight'
    const isVerticalKey = key === 'ArrowUp' || key === 'ArrowDown'
    const isNavigationKey = key === 'Home' || key === 'End'

    // Don't interfere with vertical scrolling on horizontal carousel;
    if (!isVertical && isHorizontalKey) {
      e.preventDefault()
      if (key === 'ArrowLeft') scrollLeft()
      if (key === 'ArrowRight') scrollRight()
    }

    // Don't interfere with horizontal scrolling on vertical carousel;
    if (isVertical && isVerticalKey) {
      e.preventDefault()
      if (key === 'ArrowUp') scrollLeft()
      if (key === 'ArrowDown') scrollRight()
    }

    // Home/End work for all carousels;
    if (isNavigationKey) {
      e.preventDefault()
      const scrollProperty = isVertical ? 'scrollTop' : 'scrollLeft'
      const maxScroll = isVertical ? element.scrollHeight : element.scrollWidth;
      element.scrollTo({
        [scrollProperty]: key === 'Home' ? 0 : maxScroll,
        behavior: getScrollBehavior()
      })
    }
  }

  element.addEventListener('keydown', handleKeyDown)
  
  // Return cleanup function;
  return () => {
    element.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * Announce carousel state changes to screen readers;
 * Use with aria-live regions;
 * 
 * @param message - Message to announce;
 * @param priority - 'polite' or 'assertive'
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  // Create or get existing live region;
  let liveRegion = document.querySelector('#carousel-announcer')
  
  if (!liveRegion) {
    liveRegion = document.createElement('div')
    liveRegion.id = 'carousel-announcer'
    liveRegion.setAttribute('aria-live', priority)
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.className = 'sr-only' // Visually hidden but screen-reader accessible;
    document.body.append(liveRegion)
  }

  // Update the message;
  liveRegion.textContent = message;
  // Clear after announcement (important for repeated announcements)
  setTimeout(() => {
    if (liveRegion) liveRegion.textContent = ''
  }, 1000)
}

/**
 * Focus management for carousel navigation;
 * Maintains focus on interactive elements after navigation;
 * 
 * @param currentIndex - Current slide index;
 * @param totalItems - Total number of items;
 * @returns Focus message for screen readers;
 */
export function getNavigationAnnouncement(
  currentIndex: number,
  totalItems: number
): string {
  return 'Item ' + (currentIndex + 1) + ' of ' + totalItems
}

/**
 * Check if element is in viewport;
 * Useful for lazy loading and animation triggers;
 * 
 * @param element - Element to check;
 * @param threshold - Percentage of element that must be visible (0-1)
 * @returns True if element is in viewport;
 */
export function isInViewport(element: HTMLElement, threshold = 0.5): boolean {
  const rect = element.getBoundingClientRect()
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height * threshold) >= 0)
  const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width * threshold) >= 0)

  return vertInView && horInView;
}

