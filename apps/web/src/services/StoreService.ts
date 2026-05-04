/**
 * StoreService - Handles store data fetching and management
 * Separates store API concerns from pure location calculations
 */

import { StoreData } from './LocationService';

export class StoreService {
  private static instance: StoreService;
  private cache: Map<string, StoreData[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  static getInstance(): StoreService {
    if (!StoreService.instance) {
      StoreService.instance = new StoreService();
    }
    return StoreService.instance;
  }

  /**
   * Fetch all stores from API
   */
  async getAllStores(): Promise<StoreData[]> {
    const cacheKey = 'all_stores';
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // TODO: Replace with your actual store API endpoint
      const response = await fetch('/api/stores');
      if (!response.ok) {
        throw new Error('Failed to fetch stores');
      }
      
      const stores: StoreData[] = await response.json();
      this.setCache(cacheKey, stores);
      return stores;
    } catch (error) {
      console.error('StoreService: Failed to fetch stores', error);
      throw error;
    }
  }

  /**
   * Fetch stores by location/region (optional optimization)
   */
  async getStoresByRegion(region: string): Promise<StoreData[]> {
    const cacheKey = `stores_${region}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // TODO: Implement region-based store fetching if available
      const response = await fetch(`/api/stores?region=${encodeURIComponent(region)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stores by region');
      }
      
      const stores: StoreData[] = await response.json();
      this.setCache(cacheKey, stores);
      return stores;
    } catch (error) {
      console.error('StoreService: Failed to fetch stores by region', error);
      // Fallback to all stores
      return this.getAllStores();
    }
  }

  /**
   * Get cached stores if available and not expired
   */
  private getCached(key: string): StoreData[] | null {
    const cached = this.cache.get(key);
    const expiry = this.cacheExpiry.get(key);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }
    
    return null;
  }

  /**
   * Set cache with expiry
   */
  private setCache(key: string, stores: StoreData[]): void {
    this.cache.set(key, stores);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

// Export singleton instance
export const storeService = StoreService.getInstance();
