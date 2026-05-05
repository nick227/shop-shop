/**
 * useLocationService Tests
 * Testing React hook integration and state management
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useLocationService } from '../useLocationService';
import type { StoreData } from '../../../services/LocationService';
import { locationService } from '../../../services/LocationService';
import { storeService } from '../../../services/StoreService';

// Mock the services
vi.mock('../../../services/LocationService');
vi.mock('../../../services/StoreService');

// Mock window.track for analytics
const mockTrack = vi.fn();
Object.defineProperty(window, 'track', {
  value: mockTrack,
  writable: true
});

const mockLocationService = locationService as ReturnType<typeof vi.mocked<typeof locationService>>;
const mockStoreService = storeService as ReturnType<typeof vi.mocked<typeof storeService>>;

describe('useLocationService', () => {
  const mockLocation = {
    latitude: 40.7128,
    longitude: -74.006,
    source: 'gps' as const
  };

  const mockStores: StoreData[] = [
    {
      id: '1',
      name: 'Test Store',
      address: '123 Test St',
      latitude: 40.7128,
      longitude: -74.006
    }
  ];

  const mockNearbyStores = [
    {
      ...mockStores[0],
      distance: 5,
      travelTime: 12,
      isDeliverable: true
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockLocationService.getUserLocation.mockResolvedValue(mockLocation);
    mockLocationService.getNearbyStores.mockReturnValue(mockNearbyStores);
    mockStoreService.getAllStores.mockResolvedValue(mockStores);
  });

  test('initializes with loading state', () => {
    const { result } = renderHook(() => useLocationService());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.location).toBe(null);
    expect(result.current.error).toBe(null);
    expect(result.current.nearbyStores).toEqual([]);
  });

  test('loads location and stores successfully', async () => {
    const { result } = renderHook(() => useLocationService());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.location).toEqual(mockLocation);
    expect(result.current.nearbyStores).toEqual(mockNearbyStores);
    expect(result.current.error).toBe(null);

    // Verify service calls
    expect(mockLocationService.getUserLocation).toHaveBeenCalledTimes(1);
    expect(mockStoreService.getAllStores).toHaveBeenCalledTimes(1);
    expect(mockLocationService.getNearbyStores).toHaveBeenCalledWith(mockLocation, mockStores);
    
    // Verify analytics tracking
    expect(mockTrack).toHaveBeenCalledWith('location_detected', { source: 'gps' });
  });

  test('handles location error gracefully', async () => {
    const errorMessage = 'Location permission denied';
    mockLocationService.getUserLocation.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useLocationService());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.location).toBe(null);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.nearbyStores).toEqual([]);

    // Should not track analytics on error
    expect(mockTrack).not.toHaveBeenCalled();
  });

  test('handles store service error gracefully', async () => {
    const errorMessage = 'Failed to fetch stores';
    mockStoreService.getAllStores.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useLocationService());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.location).toEqual(mockLocation);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.nearbyStores).toEqual([]);
  });

  test('refreshLocation updates data', async () => {
    const { result } = renderHook(() => useLocationService());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear previous calls
    vi.clearAllMocks();

    // Call refresh
    await result.current.refreshLocation();

    expect(mockLocationService.getUserLocation).toHaveBeenCalledTimes(1);
    expect(mockStoreService.getAllStores).toHaveBeenCalledTimes(1);
    expect(mockLocationService.getNearbyStores).toHaveBeenCalledWith(mockLocation, mockStores);
  });

  test('checkDelivery returns delivery result', async () => {
    const { result } = renderHook(() => useLocationService());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Mock the isDeliverable method to return true
    mockLocationService.isDeliverable.mockReturnValue(true);

    const deliveryResult = await result.current.checkDelivery('1');

    expect(deliveryResult).toEqual({
      isDeliverable: true,
      distance: 5,
      travelTime: 12,
      deliveryFee: undefined
    });

    // Verify analytics tracking
    expect(mockTrack).toHaveBeenCalledWith('delivery_checked', { 
      isDeliverable: true, 
      distance: 5 
    });
  });

  test('checkDelivery returns null for unknown store', async () => {
    const { result } = renderHook(() => useLocationService());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const deliveryResult = await result.current.checkDelivery('unknown');

    expect(deliveryResult).toBe(null);

    // Should not track analytics for unknown store
    expect(mockTrack).not.toHaveBeenCalledWith('delivery_checked', expect.any(Object));
  });

  test('checkDelivery handles no location', async () => {
    // Mock no location
    mockLocationService.getUserLocation.mockRejectedValue(new Error('No location'));

    const { result } = renderHook(() => useLocationService());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const deliveryResult = await result.current.checkDelivery('1');

    expect(deliveryResult).toBe(null);
  });

  test('clearLocation resets state', async () => {
    const { result } = renderHook(() => useLocationService());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify initial state
    expect(result.current.location).toEqual(mockLocation);
    expect(result.current.nearbyStores).toEqual(mockNearbyStores);

    // Clear location
    act(() => {
      result.current.clearLocation();
    });

    // Verify cleared state
    expect(result.current.location).toBe(null);
    expect(result.current.nearbyStores).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  test('tracks analytics correctly', async () => {
    const { result } = renderHook(() => useLocationService());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check location detected tracking
    expect(mockTrack).toHaveBeenCalledWith('location_detected', { source: 'gps' });

    // Mock isDeliverable for delivery tracking
    mockLocationService.isDeliverable.mockReturnValue(true);

    // Check delivery tracking
    await result.current.checkDelivery('1');
    expect(mockTrack).toHaveBeenCalledWith('delivery_checked', { 
      isDeliverable: true, 
      distance: 5 
    });
  });
});
