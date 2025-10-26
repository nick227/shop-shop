/**
 * Check Geocoding API Quota Usage
 * 
 * Monitors how many API calls have been made vs cache hits
 * Helps ensure we stay within 100 requests/month limit
 * 
 * Usage: npx tsx check-geocoding-quota.ts [--month YYYY-MM]
 */

import { prisma } from './src/client'

async function checkQuota() {
  console.log('\n📊 Geocoding Quota Usage Report')
  console.log('='.repeat(60))
  
  // Get cache stats
  const totalCached = await prisma.geocodingCache.count()
  const bySource = await prisma.geocodingCache.groupBy({
    by: ['source'],
    _count: true
  })
  
  const byType = await prisma.geocodingCache.groupBy({
    by: ['queryType'],
    _count: true
  })
  
  console.log('\n📦 Cache Statistics:')
  console.log(`  Total Entries: ${totalCached}`)
  
  console.log('\n  By Source:')
  bySource.forEach(({ source, _count }) => {
    const icon = source === 'positionstack' ? '💰' : source === 'manual_seed' ? '🌱' : '📍'
    console.log(`    ${icon} ${source}: ${_count}`)
  })
  
  console.log('\n  By Query Type:')
  byType.forEach(({ queryType, _count }) => {
    console.log(`    ${queryType}: ${_count}`)
  })
  
  // Estimate API calls made (positionstack source entries)
  const apiCalls = bySource.find(s => s.source === 'positionstack')?._count || 0
  const manualSeeds = bySource.find(s => s.source === 'manual_seed')?._count || 0
  
  console.log('\n💰 API Quota Analysis:')
  console.log(`  API Calls Made (this month): ~${apiCalls}`)
  console.log(`  Manual Seeds (free): ${manualSeeds}`)
  console.log(`  Remaining Quota: ~${100 - apiCalls} requests`)
  
  const quotaPercent = (apiCalls / 100) * 100
  const color = quotaPercent < 50 ? '✅' : quotaPercent < 80 ? '⚠️' : '🔴'
  console.log(`  ${color} Quota Used: ${quotaPercent.toFixed(1)}%`)
  
  if (quotaPercent > 80) {
    console.log('\n🔴 WARNING: Over 80% quota used!')
    console.log('   Recommendation: Run seed-geocoding-cache.ts to add more ZIP codes')
  } else if (quotaPercent > 50) {
    console.log('\n⚠️  CAUTION: Over 50% quota used')
    console.log('   Monitor usage carefully')
  } else {
    console.log('\n✅ Quota usage is healthy')
  }
  
  // Recent API calls (to see what's being geocoded)
  console.log('\n📝 Recent API Geocoding (Last 10):')
  const recentAPICalls = await prisma.geocodingCache.findMany({
    where: { source: 'positionstack' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      queryValue: true,
      city: true,
      state: true,
      createdAt: true,
    }
  })
  
  if (recentAPICalls.length === 0) {
    console.log('  No API calls found (all using cache/fallbacks)')
  } else {
    recentAPICalls.forEach((call, i) => {
      const date = call.createdAt.toLocaleDateString()
      console.log(`  ${i + 1}. ${call.queryValue} → ${call.city}, ${call.state} (${date})`)
    })
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('\n💡 Tips to Save Quota:')
  console.log('  1. Run: npx tsx seed-geocoding-cache.ts')
  console.log('  2. Frontend checks fallbacks before API')
  console.log('  3. Database caches all API results forever')
  console.log('  4. Encourage users to use their location (GPS) instead\n')
  
  await prisma.$disconnect()
}

checkQuota().catch((error) => {
  console.error('\n❌ Error:', error)
  process.exit(1)
})

