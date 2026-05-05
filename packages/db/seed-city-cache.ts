/**
 * Seed City/State Geocoding Cache
 * 
 * Pre-populates database with coordinates for major US cities
 * Saves API quota by caching common city searches
 * 
 * Usage: npx tsx seed-city-cache.ts
 */

import { PrismaClient } from '@prisma/client'

const MAJOR_CITIES = [
  { city: 'Austin', state: 'TX', lat: 30.2672, lon: -97.7431 },
  { city: 'Dallas', state: 'TX', lat: 32.7767, lon: -96.7970 },
  { city: 'Houston', state: 'TX', lat: 29.7604, lon: -95.3698 },
  { city: 'San Antonio', state: 'TX', lat: 29.4241, lon: -98.4936 },
  { city: 'Fort Worth', state: 'TX', lat: 32.7555, lon: -97.3308 },
  { city: 'New York', state: 'NY', lat: 40.7128, lon: -74.0060 },
  { city: 'Los Angeles', state: 'CA', lat: 34.0522, lon: -118.2437 },
  { city: 'Chicago', state: 'IL', lat: 41.8781, lon: -87.6298 },
  { city: 'Phoenix', state: 'AZ', lat: 33.4484, lon: -112.0740 },
  { city: 'Philadelphia', state: 'PA', lat: 39.9526, lon: -75.1652 },
  { city: 'San Diego', state: 'CA', lat: 32.7157, lon: -117.1611 },
  { city: 'San Francisco', state: 'CA', lat: 37.7749, lon: -122.4194 },
  { city: 'San Jose', state: 'CA', lat: 37.3382, lon: -121.8863 },
  { city: 'Seattle', state: 'WA', lat: 47.6062, lon: -122.3321 },
  { city: 'Denver', state: 'CO', lat: 39.7392, lon: -104.9903 },
  { city: 'Washington', state: 'DC', lat: 38.9072, lon: -77.0369 },
  { city: 'Boston', state: 'MA', lat: 42.3601, lon: -71.0589 },
  { city: 'Nashville', state: 'TN', lat: 36.1627, lon: -86.7816 },
  { city: 'Detroit', state: 'MI', lat: 42.3314, lon: -83.0458 },
  { city: 'Portland', state: 'OR', lat: 45.5152, lon: -122.6784 },
  { city: 'Las Vegas', state: 'NV', lat: 36.1699, lon: -115.1398 },
  { city: 'Memphis', state: 'TN', lat: 35.1495, lon: -90.0490 },
  { city: 'Baltimore', state: 'MD', lat: 39.2904, lon: -76.6122 },
  { city: 'Milwaukee', state: 'WI', lat: 43.0389, lon: -87.9065 },
  { city: 'Atlanta', state: 'GA', lat: 33.7490, lon: -84.3880 },
  { city: 'Miami', state: 'FL', lat: 25.7617, lon: -80.1918 },
  { city: 'Minneapolis', state: 'MN', lat: 44.9778, lon: -93.2650 },
  { city: 'Tampa', state: 'FL', lat: 27.9506, lon: -82.4572 },
  { city: 'Orlando', state: 'FL', lat: 28.5383, lon: -81.3792 },
  { city: 'Charlotte', state: 'NC', lat: 35.2271, lon: -80.8431 },
]

export async function seedCityCache(prisma: PrismaClient): Promise<void> {
  console.log('\n💾 Seeding City/State Geocoding Cache')
  console.log('='.repeat(60))
  console.log(`\nPopulating ${MAJOR_CITIES.length} major US cities...`)
  console.log('Saves Positionstack API quota (100 requests/month)\n')
  
  let created = 0
  let skipped = 0
  
  for (const entry of MAJOR_CITIES) {
    try {
      const queryValue = `${entry.city}, ${entry.state}`
      
      // Check if already exists
      const existing = await prisma.geocodingCache.findUnique({
        where: {
          queryType_queryValue: {
            queryType: 'city',
            queryValue
          }
        }
      })
      
      if (existing) {
        console.log(`  ⏭️  Skipped ${queryValue} - already cached`)
        skipped++
        continue
      }
      
      // Create cache entry
      await prisma.geocodingCache.create({
        data: {
          queryType: 'city',
          queryValue,
          latitude: entry.lat,
          longitude: entry.lon,
          city: entry.city,
          state: entry.state,
          country: 'US',
          formattedAddress: queryValue,
          confidence: 'high',
          source: 'manual_seed',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        }
      })
      
      console.log(`  ✅ Cached ${queryValue}`)
      created++
    } catch (error: any) {
      console.error(`  ❌ Error caching ${entry.city}, ${entry.state}:`, error.message)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 Seeding Complete')
  console.log('='.repeat(60))
  console.log(`✅ Created: ${created}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`📍 Total: ${MAJOR_CITIES.length}`)
  console.log('\n💡 These cities will now work instantly without API calls!')
  console.log(`💰 Estimated API quota saved: ~${created} requests\n`)
  
}

