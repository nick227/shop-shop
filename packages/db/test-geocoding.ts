/**
 * Test Geocoding API Integration
 * 
 * Tests the geocoding service with real API calls
 * Usage: npx tsx test-geocoding.ts [zipcode]
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { prisma } from './src/client'
import { createEnhancedGeocodingService } from './src/services/enhanced-geocoding.service'

// Load environment variables
config({ path: resolve(process.cwd(), '../../.env') })

const API_KEY = process.env.GEOCODING_API_KEY

async function testGeocoding() {
  console.log('\n🧪 Testing Geocoding API Integration\n')
  console.log('='.repeat(60))
  
  // Check API key
  if (!API_KEY) {
    console.error('❌ GEOCODING_API_KEY not found in environment')
    console.log('\nPlease add to .env file:')
    console.log('GEOCODING_API_KEY=your_positionstack_api_key')
    process.exit(1)
  }
  
  console.log(`✅ API Key found: ${API_KEY.substring(0, 8)}...\n`)
  
  // Create service
  const geocoder = createEnhancedGeocodingService(prisma, {
    apiKey: API_KEY,
    enableCache: true,
    cacheTTLHours: 24 * 30
  })
  
  // Test ZIP codes
  const testZips = process.argv[2] ? [process.argv[2]] : ['78758', '10018', '90210', '60601']
  
  console.log(`Testing ${testZips.length} ZIP code(s)...\n`)
  
  for (const zip of testZips) {
    console.log(`\n📍 Testing ZIP: ${zip}`)
    console.log('-'.repeat(60))
    
    try {
      const result = await geocoder.geocodeZip(zip)
      
      if (result) {
        console.log('✅ Success!')
        console.log(`   Latitude:  ${result.latitude}`)
        console.log(`   Longitude: ${result.longitude}`)
        console.log(`   City:      ${result.city}`)
        console.log(`   State:     ${result.state}`)
        console.log(`   Display:   ${result.formattedAddress}`)
        console.log(`   Source:    ${result.source}`)
        console.log(`   Confidence: ${result.confidence}`)
      } else {
        console.log('❌ No result returned (API returned null)')
      }
    } catch (error: any) {
      console.error('❌ Error:', error.message)
    }
  }
  
  // Get cache stats
  console.log('\n\n📊 Cache Statistics')
  console.log('='.repeat(60))
  try {
    const stats = await geocoder.getCacheStats()
    console.log(`Total Cached: ${stats.totalEntries}`)
    console.log(`By Type:`)
    Object.entries(stats.byType).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`)
    })
  } catch (error) {
    console.log('Unable to get cache stats')
  }
  
  console.log('\n' + '='.repeat(60) + '\n')
  
  await prisma.$disconnect()
}

testGeocoding().catch((error) => {
  console.error('\n❌ Test failed:', error)
  process.exit(1)
})

