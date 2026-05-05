/**
 * Seed Geocoding Cache
 * 
 * Pre-populates the database with coordinates for major US ZIP codes
 * This ELIMINATES the need for API calls for 40+ major metro areas
 * Saves precious Positionstack quota (100 requests/month on free tier)
 * 
 * Usage: npx tsx seed-geocoding-cache.ts
 */

import { PrismaClient } from '@prisma/client'

// Major US ZIP codes with verified coordinates
const MAJOR_ZIP_CODES = [
  // Top 10 Metro Areas
  { zip: '10018', lat: 40.7505, lon: -73.9934, city: 'New York', state: 'NY' },
  { zip: '10001', lat: 40.7509, lon: -73.9971, city: 'New York', state: 'NY' },
  { zip: '90012', lat: 34.0522, lon: -118.2437, city: 'Los Angeles', state: 'CA' },
  { zip: '90001', lat: 33.9731, lon: -118.2479, city: 'Los Angeles', state: 'CA' },
  { zip: '60601', lat: 41.8781, lon: -87.6298, city: 'Chicago', state: 'IL' },
  { zip: '60007', lat: 41.9742, lon: -87.8826, city: 'Chicago', state: 'IL' },
  { zip: '75201', lat: 32.7767, lon: -96.7970, city: 'Dallas', state: 'TX' },
  { zip: '77001', lat: 29.7604, lon: -95.3698, city: 'Houston', state: 'TX' },
  { zip: '85001', lat: 33.4484, lon: -112.0740, city: 'Phoenix', state: 'AZ' },
  { zip: '19019', lat: 39.9526, lon: -75.1652, city: 'Philadelphia', state: 'PA' },
  
  // Texas Major Cities
  { zip: '78758', lat: 30.3672, lon: -97.7223, city: 'Austin', state: 'TX' },
  { zip: '78701', lat: 30.2672, lon: -97.7431, city: 'Austin', state: 'TX' },
  { zip: '78704', lat: 30.2440, lon: -97.7640, city: 'Austin', state: 'TX' },
  { zip: '75001', lat: 32.9483, lon: -96.7301, city: 'Dallas', state: 'TX' },
  { zip: '77002', lat: 29.7589, lon: -95.3677, city: 'Houston', state: 'TX' },
  { zip: '78205', lat: 29.4241, lon: -98.4936, city: 'San Antonio', state: 'TX' },
  { zip: '76101', lat: 32.7555, lon: -97.3308, city: 'Fort Worth', state: 'TX' },
  
  // West Coast
  { zip: '94102', lat: 37.7749, lon: -122.4194, city: 'San Francisco', state: 'CA' },
  { zip: '94110', lat: 37.7485, lon: -122.4156, city: 'San Francisco', state: 'CA' },
  { zip: '92101', lat: 32.7157, lon: -117.1611, city: 'San Diego', state: 'CA' },
  { zip: '95101', lat: 37.3382, lon: -121.8863, city: 'San Jose', state: 'CA' },
  { zip: '98101', lat: 47.6062, lon: -122.3321, city: 'Seattle', state: 'WA' },
  { zip: '97201', lat: 45.5152, lon: -122.6784, city: 'Portland', state: 'OR' },
  { zip: '89101', lat: 36.1699, lon: -115.1398, city: 'Las Vegas', state: 'NV' },
  
  // East Coast
  { zip: '02101', lat: 42.3601, lon: -71.0589, city: 'Boston', state: 'MA' },
  { zip: '20001', lat: 38.9072, lon: -77.0369, city: 'Washington', state: 'DC' },
  { zip: '30301', lat: 33.7490, lon: -84.3880, city: 'Atlanta', state: 'GA' },
  { zip: '33101', lat: 25.7617, lon: -80.1918, city: 'Miami', state: 'FL' },
  { zip: '32801', lat: 28.5383, lon: -81.3792, city: 'Orlando', state: 'FL' },
  
  // Midwest
  { zip: '48201', lat: 42.3314, lon: -83.0458, city: 'Detroit', state: 'MI' },
  { zip: '55401', lat: 44.9778, lon: -93.2650, city: 'Minneapolis', state: 'MN' },
  { zip: '63101', lat: 38.6270, lon: -90.1994, city: 'St. Louis', state: 'MO' },
  { zip: '43201', lat: 39.9612, lon: -82.9988, city: 'Columbus', state: 'OH' },
  { zip: '46201', lat: 39.7684, lon: -86.1581, city: 'Indianapolis', state: 'IN' },
  { zip: '53201', lat: 43.0389, lon: -87.9065, city: 'Milwaukee', state: 'WI' },
  
  // South
  { zip: '28201', lat: 35.2271, lon: -80.8431, city: 'Charlotte', state: 'NC' },
  { zip: '37201', lat: 36.1627, lon: -86.7816, city: 'Nashville', state: 'TN' },
  { zip: '38101', lat: 35.1495, lon: -90.0490, city: 'Memphis', state: 'TN' },
  { zip: '40201', lat: 38.2527, lon: -85.7585, city: 'Louisville', state: 'KY' },
  { zip: '73101', lat: 35.4676, lon: -97.5164, city: 'Oklahoma City', state: 'OK' },
  
  // Mountain/West
  { zip: '80201', lat: 39.7392, lon: -104.9903, city: 'Denver', state: 'CO' },
  { zip: '84101', lat: 40.7608, lon: -111.8910, city: 'Salt Lake City', state: 'UT' },
  { zip: '87101', lat: 35.0844, lon: -106.6504, city: 'Albuquerque', state: 'NM' },
  { zip: '83701', lat: 43.6150, lon: -116.2023, city: 'Boise', state: 'ID' },
  
  // Pacific
  { zip: '96801', lat: 21.3099, lon: -157.8581, city: 'Honolulu', state: 'HI' },
  { zip: '99501', lat: 61.2181, lon: -149.9003, city: 'Anchorage', state: 'AK' },
]

export async function seedGeocodingCache(prisma: PrismaClient): Promise<void> {
  console.log('\n💾 Seeding Geocoding Cache')
  console.log('='.repeat(60))
  console.log(`\nPopulating ${MAJOR_ZIP_CODES.length} major US ZIP codes...`)
  console.log('This saves Positionstack API quota (100 requests/month)\n')
  
  let created = 0
  let skipped = 0
  
  for (const entry of MAJOR_ZIP_CODES) {
    try {
      // Check if already exists
      const existing = await prisma.geocodingCache.findUnique({
        where: {
          queryType_queryValue: {
            queryType: 'zip',
            queryValue: entry.zip
          }
        }
      })
      
      if (existing) {
        console.log(`  ⏭️  Skipped ${entry.zip} (${entry.city}, ${entry.state}) - already cached`)
        skipped++
        continue
      }
      
      // Create cache entry
      await prisma.geocodingCache.create({
        data: {
          queryType: 'zip',
          queryValue: entry.zip,
          latitude: entry.lat,
          longitude: entry.lon,
          city: entry.city,
          state: entry.state,
          zip: entry.zip,
          country: 'US',
          formattedAddress: `${entry.city}, ${entry.state} ${entry.zip}`,
          confidence: 'high',
          source: 'manual_seed',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        }
      })
      
      console.log(`  ✅ Cached ${entry.zip} (${entry.city}, ${entry.state})`)
      created++
    } catch (error: any) {
      console.error(`  ❌ Error caching ${entry.zip}:`, error.message)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 Seeding Complete')
  console.log('='.repeat(60))
  console.log(`✅ Created: ${created}`)
  console.log(`⏭️  Skipped: ${skipped} (already existed)`)
  console.log(`📍 Total: ${MAJOR_ZIP_CODES.length}`)
  console.log('\n💡 These ZIP codes will now work instantly without API calls!')
  console.log('💰 Estimated API quota saved: ~' + created + ' requests\n')
  
}

