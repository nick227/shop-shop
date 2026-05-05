/**
 * useLocationService - React hook for LocationService
 * Provides location functionality with loading states and error handling
 */

import { useState, useEffect, useCallback } from 'react';
import type { LocationData, StoreWithDistance, DeliveryResult} from '../../services/LocationService';
import { locationService, StoreData } from '../../services/LocationService';
import { storeService } from '../../services/StoreService';

export interface UseLocationState {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  nearbyStores: StoreWithDistance[];
}

export interface UseLocationActions {
  refreshLocation: () => Promise<void>;
  checkDelivery: (storeId: string) => Promise<DeliveryResult | null>;
  clearLocation: () => void;
}

export function useLocationService(): UseLocationState & UseLocationActions {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nearbyStores, setNearbyStores] = useState<StoreWithDistance[]>([]);

  const refreshLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userLocation = await locationService.getUserLocation();
      setLocation(userLocation);
      
      // Fetch stores from StoreService
      const stores = await storeService.getAllStores();
      
      // Process stores through LocationService (pure function)
      const nearbyStores = locationService.getNearbyStores(userLocation, stores);
      setNearbyStores(nearbyStores);
      
      // Track location detection (lightweight analytics)
      if (typeof window !== 'undefined' && (window as any).track) {
        (window as any).track('location_detected', { source: userLocation.source });
      }
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Location detection failed');
      setNearbyStores([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkDelivery = useCallback(async (storeId: string): Promise<DeliveryResult | null> => {
    if (!location) return null;
    
    try {
      // Find the store in nearby stores
      const store = nearbyStores.find(s => s.id === storeId);
      if (!store) return null;
      
      const isDeliverable = locationService.isDeliverable(store, location);
      const result: DeliveryResult = {
        isDeliverable,
        distance: store.distance,
        travelTime: store.travelTime,
        deliveryFee: store.deliveryFee
      };
      
      // Track delivery check (lightweight analytics)
      if (typeof window !== 'undefined' && (window as any).track) {
        (window as any).track('delivery_checked', { isDeliverable, distance: store.distance });
      }
      
      return result;
    } catch (error_) {
      console.error('Delivery check failed:', error_);
      return null;
    }
  }, [location, nearbyStores]);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setNearbyStores([]);
    setError(null);
  }, []);

  // Auto-refresh location on mount
  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  return {
    location,
    isLoading,
    error,
    nearbyStores,
    refreshLocation,
    checkDelivery,
    clearLocation
  };
}
