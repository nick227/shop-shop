/**
 * Sample Store Data for Development;
 * Provides sample store data when database is empty;
 */

export interface SampleStore {
  id: string;
  name: string;
  slug: string;
  description: string;
  companyName: string;
  phone: string;
  email: string;
  website: string;
  isPublished: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  prepTimeMin: number;
  latitude: number;
  longitude: number;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  addressCountry: string;
}

export const SAMPLE_STORES: SampleStore[] = [
  {
    id: 'sample-store-1',
    name: 'Mario\'s Italian Bistro',
    slug: 'marios-italian-bistro',
    description: 'Authentic Italian cuisine with fresh pasta and traditional recipes',
    companyName: 'Mario\'s Italian Bistro LLC',
    phone: '(555) 123-4567',
    email: 'info@mariosbistro.com',
    website: 'https://mariosbistro.com',
    isPublished: true,
    deliveryEnabled: true,
    pickupEnabled: true,
    prepTimeMin: 20,
    latitude: 37.7749,
    longitude: -122.4194,
    addressStreet: '123 Market Street',
    addressCity: 'San Francisco',
    addressState: 'CA',
    addressZip: '94102',
    addressCountry: 'US'
  },
  {
    id: 'sample-store-2',
    name: 'Golden Dragon Chinese',
    slug: 'golden-dragon-chinese',
    description: 'Traditional Chinese dishes with modern presentation',
    companyName: 'Golden Dragon Restaurant',
    phone: '(555) 234-5678',
    email: 'orders@goldendragon.com',
    website: 'https://goldendragon.com',
    isPublished: true,
    deliveryEnabled: true,
    pickupEnabled: true,
    prepTimeMin: 15,
    latitude: 37.7849,
    longitude: -122.4094,
    addressStreet: '456 Grant Avenue',
    addressCity: 'San Francisco',
    addressState: 'CA',
    addressZip: '94108',
    addressCountry: 'US'
  },
  {
    id: 'sample-store-3',
    name: 'Burger Palace',
    slug: 'burger-palace',
    description: 'Gourmet burgers made with locally sourced ingredients',
    companyName: 'Burger Palace Inc',
    phone: '(555) 345-6789',
    email: 'hello@burgerpalace.com',
    website: 'https://burgerpalace.com',
    isPublished: true,
    deliveryEnabled: true,
    pickupEnabled: true,
    prepTimeMin: 10,
    latitude: 37.7649,
    longitude: -122.4294,
    addressStreet: '789 Mission Street',
    addressCity: 'San Francisco',
    addressState: 'CA',
    addressZip: '94103',
    addressCountry: 'US'
  },
  {
    id: 'sample-store-4',
    name: 'Sushi Zen',
    slug: 'sushi-zen',
    description: 'Fresh sushi and sashimi with traditional Japanese techniques',
    companyName: 'Sushi Zen Restaurant',
    phone: '(555) 456-7890',
    email: 'reservations@sushizen.com',
    website: 'https://sushizen.com',
    isPublished: true,
    deliveryEnabled: false,
    pickupEnabled: true,
    prepTimeMin: 25,
    latitude: 37.7549,
    longitude: -122.4394,
    addressStreet: '321 Geary Boulevard',
    addressCity: 'San Francisco',
    addressState: 'CA',
    addressZip: '94102',
    addressCountry: 'US'
  },
  {
    id: 'sample-store-5',
    name: 'Taco Libre',
    slug: 'taco-libre',
    description: 'Authentic Mexican street tacos and burritos',
    companyName: 'Taco Libre LLC',
    phone: '(555) 567-8901',
    email: 'orders@tacolibre.com',
    website: 'https://tacolibre.com',
    isPublished: true,
    deliveryEnabled: true,
    pickupEnabled: true,
    prepTimeMin: 12,
    latitude: 37.7449,
    longitude: -122.4494,
    addressStreet: '654 Valencia Street',
    addressCity: 'San Francisco',
    addressState: 'CA',
    addressZip: '94110',
    addressCountry: 'US'
  }
]

/**
 * Get sample stores for a specific location;
 */
export function getSampleStoresForLocation(
  latitude: number, 
  longitude: number, 
  radiusMiles: number = 25
): SampleStore[] {
  // For development, return all sample stores;
  // In a real implementation, you'd filter by distance;
  return SAMPLE_STORES.filter(store => {
    // Simple distance calculation (not accurate for production)
    const distance = Math.sqrt(
      Math.pow(store.latitude - latitude, 2) + 
      Math.pow(store.longitude - longitude, 2)
    ) * 69 // Rough miles conversion;
    return distance <= radiusMiles;
  })
}

/**
 * Get sample stores for development;
 */
export function getSampleStores(): SampleStore[] {
  return SAMPLE_STORES;
}
