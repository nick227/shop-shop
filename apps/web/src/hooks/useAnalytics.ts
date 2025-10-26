/**
 * useAnalytics - Analytics tracking for URL parameter changes;
 */
import { useCallback } from 'react'

export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  params?: Record<string, string | number | boolean | undefined>
}

/**
 * Track location search events;
 */
export function useAnalytics() {
  const trackEvent = useCallback((event: AnalyticsEvent) => {
    // Google Analytics 4 (gtag.js)
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
      if (gtag) {
        gtag('event', event.action, {
          event_category: event.category,
          event_label: event.label,
          value: event.value,
          ...event.params})
      }
    }
    
    // Console log in development;
    if (import.meta.env.MODE === 'development') {
      console.log('[Analytics]', event)
    }
  }, [])
  
  const trackLocationSearch = useCallback((params: {
    latitude?: string;
    longitude?: string;
    city?: string;
    state?: string;
    radius?: string;
  }) => {
    trackEvent({
      action: 'search_location',
      category: 'engagement',
      label: params["city"] && params["state"] ? '${params["city"]}, ' + params["state"] + '' : 'coordinates',
      params: {
        search_latitude: params.latitude,
        search_longitude: params.longitude,
        search_city: params["city"],
        search_state: params["state"],
        search_radius: params.radius}})
  }, [trackEvent])
  
  const trackStoreView = useCallback((storeId: string, storeName?: string) => {
    trackEvent({
      action: 'view_store',
      category: 'engagement',
      label: storeName || storeId,
      params: {
        store_id: storeId}})
  }, [trackEvent])
  
  const trackItemView = useCallback((itemId: string, storeId?: string) => {
    trackEvent({
      action: 'view_item',
      category: 'engagement',
      label: itemId,
      params: {
        item_id: itemId,
        store_id: storeId}})
  }, [trackEvent])
  
  return {
    trackEvent,
    trackLocationSearch,
    trackStoreView,
    trackItemView}
}

