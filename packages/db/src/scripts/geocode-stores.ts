/**
 * Geocode Stores Script
 * Batch geocodes existing stores using their structured address fields
 * 
 * Usage: tsx src/scripts/geocode-stores.ts
 */
import { prisma } from '../client.js'
import { createGeocodingAdapter, GeocodingAdapter } from '../adapters/geocoding.adapter.js'
import { config } from 'dotenv'

// Load environment variables from project root
config({ path: '../../.env' })

const GEOCODING_API_KEY = process.env.GEOCODING_API_KEY

if (!GEOCODING_API_KEY) {
  console.error('❌ GEOCODING_API_KEY not found in environment variables')
  console.error('Add it to .env file: GEOCODING_API_KEY=your_key_here')
  process.exit(1)
}

async function geocodeStores() {
  console.log('🗺️  Starting store geocoding process...\n')

  // Initialize geocoding adapter
  const geocoder: GeocodingAdapter = createGeocodingAdapter({
    apiKey: GEOCODING_API_KEY,
  })

  // Fetch all stores that need geocoding
  const stores = await prisma.store.findMany({
    where: {
      OR: [
        { latitude: null },
        { longitude: null },
      ],
    },
    select: {
      id: true,
      name: true,
      addressStreet: true,
      addressCity: true,
      addressState: true,
      addressZip: true,
      addressCountry: true,
      latitude: true,
      longitude: true,
    },
  })

  console.log(`Found ${stores.length} stores that need geocoding\n`)

  if (stores.length === 0) {
    console.log('✓ All stores already have coordinates!')
    return
  }

  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [] as Array<{ storeName: string; error: string }>,
  }

  // Process each store
  for (let i = 0; i < stores.length; i++) {
    const store = stores[i]
    const progress = `[${i + 1}/${stores.length}]`

    // Skip if already has coordinates
    if (store.latitude && store.longitude) {
      console.log(`${progress} ⏭️  ${store.name} - Already geocoded`)
      results.skipped++
      continue
    }

    try {
      // Check for valid address
      if (!store.addressCity) {
        console.log(`${progress} ⚠️  ${store.name} - No valid address (missing city)`)
        results.failed++
        results.errors.push({
          storeName: store.name,
          error: 'Missing address city',
        })
        continue
      }

      // Build address string from structured fields
      const addressParts: string[] = []
      if (store.addressStreet) addressParts.push(store.addressStreet)
      if (store.addressCity) addressParts.push(store.addressCity)
      if (store.addressState) addressParts.push(store.addressState)
      if (store.addressZip) addressParts.push(store.addressZip)
      if (store.addressCountry) addressParts.push(store.addressCountry)

      const fullAddress = addressParts.join(', ')
      
      console.log(`${progress} 🔍 ${store.name}`)
      console.log(`       Address: ${fullAddress}`)

      // Geocode
      const geocodeResult = await geocoder.geocodeAddress(fullAddress)

      if (!geocodeResult) {
        console.log(`${progress} ❌ ${store.name} - Geocoding failed`)
        results.failed++
        results.errors.push({
          storeName: store.name,
          error: 'Geocoding API returned no results',
        })
        continue
      }

      // Update store with improved address data from geocoding
      await prisma.store.update({
        where: { id: store.id },
        data: {
          latitude: geocodeResult.latitude,
          longitude: geocodeResult.longitude,
          addressStreet: store.addressStreet || null,
          addressCity: geocodeResult.city || store.addressCity || null,
          addressState: geocodeResult.state || store.addressState || null,
          addressZip: geocodeResult.zip || store.addressZip || null,
          addressCountry: geocodeResult.country || store.addressCountry || 'US',
          geocodedAt: new Date(),
          geocodeSource: 'api',
        },
      })

      console.log(`${progress} ✓ ${store.name} - Geocoded successfully`)
      console.log(`       Coordinates: ${geocodeResult.latitude}, ${geocodeResult.longitude}`)
      console.log(`       Confidence: ${geocodeResult.confidence}\n`)
      
      results.success++

      // Rate limiting: Wait 100ms between requests (max 600/min, well under 833/day limit)
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      console.error(`${progress} ❌ ${store.name} - Error:`, error)
      results.failed++
      results.errors.push({
        storeName: store.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 GEOCODING SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total stores processed: ${stores.length}`)
  console.log(`✓ Successfully geocoded: ${results.success}`)
  console.log(`⏭️  Skipped (already geocoded): ${results.skipped}`)
  console.log(`❌ Failed: ${results.failed}`)

  if (results.errors.length > 0) {
    console.log('\n❌ Failed Stores (manual review needed):')
    results.errors.forEach(err => {
      console.log(`   - ${err.storeName}: ${err.error}`)
    })
  }

  console.log('\n✓ Geocoding process complete!')
}

// Run the script
geocodeStores()
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

