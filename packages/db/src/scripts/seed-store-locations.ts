/**
 * @deprecated Superseded by seed-austin-stores.ts which creates stores with
 * real coordinates already set. This script is no longer called by pnpm seed.
 */
import { prisma } from '../client.js'

const SAMPLE_LOCATIONS = [
  { city: 'New York', state: 'NY', zip: '10001', lat: 40.7505, lng: -73.9934 },
  { city: 'Los Angeles', state: 'CA', zip: '90012', lat: 34.0522, lng: -118.2437 },
  { city: 'San Francisco', state: 'CA', zip: '94102', lat: 37.7749, lng: -122.4194 },
  { city: 'Chicago', state: 'IL', zip: '60601', lat: 41.8781, lng: -87.6298 },
  { city: 'Miami', state: 'FL', zip: '33101', lat: 25.7617, lng: -80.1918 },
  { city: 'Seattle', state: 'WA', zip: '98101', lat: 47.6062, lng: -122.3321 },
  { city: 'Austin', state: 'TX', zip: '78701', lat: 30.2672, lng: -97.7431 },
  { city: 'Portland', state: 'OR', zip: '97201', lat: 45.5152, lng: -122.6784 },
  { city: 'Denver', state: 'CO', zip: '80202', lat: 39.7392, lng: -104.9903 },
  { city: 'Boston', state: 'MA', zip: '02101', lat: 42.3601, lng: -71.0589 },
  { city: 'Atlanta', state: 'GA', zip: '30303', lat: 33.7490, lng: -84.3880 },
  { city: 'Phoenix', state: 'AZ', zip: '85001', lat: 33.4484, lng: -112.0740 },
  { city: 'Las Vegas', state: 'NV', zip: '89101', lat: 36.1699, lng: -115.1398 },
  { city: 'Nashville', state: 'TN', zip: '37201', lat: 36.1627, lng: -86.7816 },
  { city: 'Philadelphia', state: 'PA', zip: '19101', lat: 39.9526, lng: -75.1652 },
  { city: 'Dallas', state: 'TX', zip: '75201', lat: 32.7767, lng: -96.7970 },
  { city: 'San Diego', state: 'CA', zip: '92101', lat: 32.7157, lng: -117.1611 },
  { city: 'Minneapolis', state: 'MN', zip: '55401', lat: 44.9778, lng: -93.2650 },
  { city: 'New Orleans', state: 'LA', zip: '70112', lat: 29.9511, lng: -90.0715 },
  { city: 'Detroit', state: 'MI', zip: '48201', lat: 42.3314, lng: -83.0458 },
]

async function seedStoreLocations() {
  console.log('📍 Seeding store locations with sample coordinates...\n')

  // Get stores without coordinates
  const stores = await prisma.store.findMany({
    where: {
      latitude: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  console.log(`Found ${stores.length} stores without coordinates`)
  console.log(`Will assign coordinates from ${SAMPLE_LOCATIONS.length} sample cities\n`)

  let updated = 0
  let skipped = 0

  for (let i = 0; i < stores.length; i++) {
    const store = stores[i]
    const location = SAMPLE_LOCATIONS[i % SAMPLE_LOCATIONS.length]
    
    // Generate a random street address
    const streetNumber = Math.floor(Math.random() * 9000) + 1000
    const streetNames = ['Main St', 'Oak Ave', 'Maple Dr', 'Pine Rd', 'Cedar Ln', 'Elm St', 'Park Ave', 'Broadway']
    const streetName = streetNames[Math.floor(Math.random() * streetNames.length)]
    const street = `${streetNumber} ${streetName}`
    
    // Add small random offset to coordinates (within ~0.5 miles)
    const latOffset = (Math.random() - 0.5) * 0.01 // ~0.5 miles
    const lngOffset = (Math.random() - 0.5) * 0.01
    
    try {
      await prisma.store.update({
        where: { id: store.id },
        data: {
          latitude: location.lat + latOffset,
          longitude: location.lng + lngOffset,
          addressStreet: street,
          addressCity: location.city,
          addressState: location.state,
          addressZip: location.zip,
          addressCountry: 'US',
          geocodedAt: new Date(),
          geocodeSource: 'manual',
        },
      })
      
      console.log(`✓ [${i + 1}/${stores.length}] ${store.name}`)
      console.log(`   ${street}, ${location.city}, ${location.state} ${location.zip}`)
      console.log(`   Coordinates: ${(location.lat + latOffset).toFixed(4)}, ${(location.lng + lngOffset).toFixed(4)}\n`)
      
      updated++
    } catch (error) {
      console.error(`✗ [${i + 1}/${stores.length}] ${store.name} - Error:`, error)
      skipped++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 SEEDING SUMMARY')
  console.log('='.repeat(60))
  console.log(`✓ Stores updated: ${updated}`)
  console.log(`✗ Skipped: ${skipped}`)
  console.log('\n✓ Location seeding complete!')
}

// Run the script
seedStoreLocations()
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

