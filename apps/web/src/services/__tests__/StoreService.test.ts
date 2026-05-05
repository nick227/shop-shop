/**
 * StoreService Tests
 * Testing store data fetching and caching
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { StoreService } from '../StoreService';
import type { StoreData } from '../LocationService';

// Mock fetch
global.fetch = vi.fn();

describe('StoreService', () => {
  let storeService: StoreService;
  const mockStores: StoreData[] = [
    {
      id: '1',
      name: 'Test Store 1',
      address: '123 Test St',
      latitude: 40.7128,
      longitude: -74.006
    },
    {
      id: '2',
      name: 'Test Store 2',
      address: '456 Test St',
      latitude: 42.3601,
      longitude: -71.0589
    }
  ];

  beforeEach(() => {
    storeService = StoreService.getInstance();
    storeService.clearCache();
    jest.clearAllMocks();
  });

  describe('getAllStores', () => {
    test('fetches stores successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStores
      });

      const result = await storeService.getAllStores();

      expect(result).toEqual(mockStores);
      expect(fetch).toHaveBeenCalledWith('/api/stores');
    });

    test('caches results for subsequent calls', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStores
      });

      // First call
      await storeService.getAllStores();
      // Second call should use cache
      await storeService.getAllStores();

      // Should only call fetch once
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('throws error when fetch fails', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(storeService.getAllStores()).rejects.toThrow('Failed to fetch stores');
    });

    test('throws error when network fails', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(storeService.getAllStores()).rejects.toThrow('Network error');
    });
  });

  describe('getStoresByRegion', () => {
    test('fetches stores by region successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockStores[0]]
      });

      const result = await storeService.getStoresByRegion('nyc');

      expect(result).toEqual([mockStores[0]]);
      expect(fetch).toHaveBeenCalledWith('/api/stores?region=nyc');
    });

    test('falls back to getAllStores when region fetch fails', async () => {
      // Region fetch fails
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 404
        })
        // Fallback to all stores
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStores
        });

      const result = await storeService.getStoresByRegion('unknown');

      expect(result).toEqual(mockStores);
      expect(fetch).toHaveBeenCalledWith('/api/stores?region=unknown');
      expect(fetch).toHaveBeenCalledWith('/api/stores');
    });

    test('caches region-specific results', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockStores[0]]
      });

      // First call
      await storeService.getStoresByRegion('nyc');
      // Second call should use cache
      await storeService.getStoresByRegion('nyc');

      // Should only call fetch once for region
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('encodes region parameter correctly', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      await storeService.getStoresByRegion('new york');

      expect(fetch).toHaveBeenCalledWith('/api/stores?region=new%20york');
    });
  });

  describe('caching', () => {
    test('clearCache removes all cached data', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockStores
      });

      // Cache some data
      await storeService.getAllStores();
      await storeService.getStoresByRegion('nyc');

      // Clear cache
      storeService.clearCache();

      // Next calls should fetch again
      await storeService.getAllStores();
      await storeService.getStoresByRegion('nyc');

      // Should call fetch twice (once for each after cache clear)
      expect(fetch).toHaveBeenCalledTimes(4);
    });

    test('cache expires after duration', async () => {
      jest.useFakeTimers();
      
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockStores
      });

      // First call
      await storeService.getAllStores();

      // Fast-forward past cache duration (10 minutes + 1 second)
      jest.advanceTimersByTime(10 * 60 * 1000 + 1000);

      // Second call should fetch again
      await storeService.getAllStores();

      expect(fetch).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });
  });

  describe('singleton pattern', () => {
    test('returns same instance', () => {
      const instance1 = StoreService.getInstance();
      const instance2 = StoreService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});
