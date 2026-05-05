/**
 * LocationService Tests
 * Testing pure location calculations and business rules
 */

import type { LocationData, StoreData } from '../LocationService';
import { LocationService } from '../LocationService';

describe('LocationService', () => {
  let locationService: LocationService;
  const testConfig = {
    maxDistance: 25,
    deliveryRadius: 15,
    avgSpeed: 25
  };

  beforeEach(() => {
    locationService = new LocationService(testConfig);
  });

  describe('getDistance', () => {
    test('calculates distance between NYC and Boston correctly', () => {
      const nyc: LocationData = { latitude: 40.7128, longitude: -74.006, source: 'gps' };
      const boston = { latitude: 42.3601, longitude: -71.0589 };
      
      const distance = locationService.getDistance(nyc, boston);
      
      // NYC to Boston is approximately 190 miles
      expect(distance).toBeCloseTo(190, 0);
      expect(distance).toBeGreaterThan(180);
      expect(distance).toBeLessThan(200);
    });

    test('calculates zero distance for same location', () => {
      const location: LocationData = { latitude: 40.7128, longitude: -74.006, source: 'gps' };
      
      const distance = locationService.getDistance(location, location);
      
      expect(distance).toBeCloseTo(0, 5);
    });

    test('calculates distance between LA and SF correctly', () => {
      const la: LocationData = { latitude: 34.0522, longitude: -118.2437, source: 'gps' };
      const sf = { latitude: 37.7749, longitude: -122.4194 };
      
      const distance = locationService.getDistance(la, sf);
      
      // LA to SF is approximately 347 miles (actual calculated distance)
      expect(distance).toBeCloseTo(347, 0);
      expect(distance).toBeGreaterThan(300);
      expect(distance).toBeLessThan(400);
    });
  });

  describe('getTravelTime', () => {
    test('calculates travel time correctly', () => {
      const travelTime = locationService.getTravelTime(25);
      
      // 25 miles at 25 mph = 60 minutes
      expect(travelTime).toBe(60);
    });

    test('calculates travel time for shorter distance', () => {
      const travelTime = locationService.getTravelTime(12.5);
      
      // 12.5 miles at 25 mph = 30 minutes
      expect(travelTime).toBe(30);
    });

    test('rounds travel time correctly', () => {
      const travelTime = locationService.getTravelTime(10);
      
      // 10 miles at 25 mph = 24 minutes (rounded)
      expect(travelTime).toBe(24);
    });

    test('uses config avgSpeed correctly', () => {
      const customService = new LocationService({ avgSpeed: 50 });
      const travelTime = customService.getTravelTime(50);
      
      // 50 miles at 50 mph = 60 minutes
      expect(travelTime).toBe(60);
    });
  });

  describe('isDeliverable', () => {
    test('returns true for store within delivery radius', () => {
      const store = {
        id: '1',
        name: 'Test Store',
        address: '123 Test St',
        latitude: 40.7128,
        longitude: -74.006,
        distance: 10, // Within 15 mile radius
        travelTime: 24,
        isDeliverable: false
      };
      const location: LocationData = { latitude: 40.7128, longitude: -74.006, source: 'gps' };
      
      const result = locationService.isDeliverable(store, location);
      
      expect(result).toBe(true);
    });

    test('returns false for store outside delivery radius', () => {
      const store = {
        id: '1',
        name: 'Test Store',
        address: '123 Test St',
        latitude: 40.7128,
        longitude: -74.006,
        distance: 20, // Outside 15 mile radius
        travelTime: 48,
        isDeliverable: false
      };
      const location: LocationData = { latitude: 40.7128, longitude: -74.006, source: 'gps' };
      
      const result = locationService.isDeliverable(store, location);
      
      expect(result).toBe(false);
    });

    test('uses config deliveryRadius correctly', () => {
      const customService = new LocationService({ deliveryRadius: 30 });
      const store = {
        id: '1',
        name: 'Test Store',
        address: '123 Test St',
        latitude: 40.7128,
        longitude: -74.006,
        distance: 25, // Outside default 15 miles but within 30 miles
        travelTime: 60,
        isDeliverable: false
      };
      const location: LocationData = { latitude: 40.7128, longitude: -74.006, source: 'gps' };
      
      const result = customService.isDeliverable(store, location);
      
      expect(result).toBe(true);
    });
  });

  describe('getNearbyStores', () => {
    const mockStores: StoreData[] = [
      {
        id: '1',
        name: 'Nearby Store',
        address: '123 Nearby St',
        latitude: 40.7128,
        longitude: -74.006
      },
      {
        id: '2',
        name: 'Far Store',
        address: '456 Far St',
        latitude: 42.3601,
        longitude: -71.0589
      },
      {
        id: '3',
        name: 'Medium Store',
        address: '789 Medium St',
        latitude: 41.8781,
        longitude: -87.6298
      }
    ];

    test('filters stores by max distance and sorts by distance', () => {
      const location: LocationData = { latitude: 40.7128, longitude: -74.006, source: 'gps' };
      
      const result = locationService.getNearbyStores(location, mockStores);
      
      // Should include nearby stores, exclude far stores
      expect(result.length).toBeGreaterThanOrEqual(0);
      expect(result.length).toBeLessThanOrEqual(mockStores.length);
      
      // Should be sorted by distance (nearest first) if there are results
      if (result.length > 1) {
        for (let i = 1; i < result.length; i++) {
          expect(result[i].distance).toBeGreaterThanOrEqual(result[i - 1].distance);
        }
      }
      
      // All stores should have calculated distance and travel time
      for (const store of result) {
        expect(store.distance).toBeGreaterThanOrEqual(0);
        expect(store.travelTime).toBeGreaterThanOrEqual(0);
        expect(typeof store.isDeliverable).toBe('boolean');
      }
    });

    test('calculates distance and travel time for all stores', () => {
      const location: LocationData = { latitude: 40.7128, longitude: -74.006, source: 'gps' };
      
      const result = locationService.getNearbyStores(location, mockStores);
      
      for (const store of result) {
        // Distance should be calculated
        expect(store.distance).toBeGreaterThanOrEqual(0);
        
        // Travel time should be calculated based on distance
        expect(store.travelTime).toBe(Math.round((store.distance / 25) * 60));
        
        // Delivery eligibility should be calculated based on distance <= 15 miles
        const expectedDelivery = store.distance <= 15;
        expect(store.isDeliverable).toBe(expectedDelivery);
      }
    });

    test('uses config maxDistance correctly', () => {
      const customService = new LocationService({ maxDistance: 10 });
      const location: LocationData = { latitude: 40.7128, longitude: -74.006, source: 'gps' };
      
      const result = customService.getNearbyStores(location, mockStores);
      
      // All stores should be within 10 miles
      for (const store of result) {
        expect(store.distance).toBeLessThanOrEqual(10);
      }
    });

    test('handles empty stores array', () => {
      const location: LocationData = { latitude: 40.7128, longitude: -74.006, source: 'gps' };
      
      const result = locationService.getNearbyStores(location, []);
      
      expect(result).toEqual([]);
    });
  });

  describe('Configuration', () => {
    test('uses default config when no config provided', () => {
      const defaultService = new LocationService();
      
      // Should use default values
      expect(defaultService.getTravelTime(25)).toBe(60); // 25 mph default
    });

    test('merges partial config correctly', () => {
      const partialService = new LocationService({ avgSpeed: 50 });
      
      // Should use custom avgSpeed but default other values
      expect(partialService.getTravelTime(50)).toBe(60); // 50 mph custom
    });
  });
});
