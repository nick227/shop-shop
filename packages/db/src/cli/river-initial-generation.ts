import { ExtendedPrismaClient } from '@packages/db'
import { runEnhancedRiverIngestion } from '../services/river-ingest-enhanced.service'

// ========================================
// Initial River Content Generation
// ========================================
// Creates 100-500 initial posts for new river feed system
// Runs once to populate river with diverse content

async function main() {
  console.log('🚀 Starting initial river content generation...')
  
  // Initialize database connection
  const { prisma } = await import('@packages/db')
  
  try {
    // Run initial generation with target of 100-500 posts
    const result = await runEnhancedRiverIngestion(prisma, {
      targetPosts: Math.min(100, Math.max(50, Math.floor(Math.random() * 50))), // Random 50-100 for initial run
      varietyStrategy: {
        ensureCategoryBalance: true,
        ensureGeographicDiversity: true,
        ensurePriceRangeMix: true
      }
    })
    
    console.log('✅ Initial river generation completed!')
    console.log(`📊 Results: ${result.created} created, ${JSON.stringify(result.skipped)} skipped, ${result.errors} errors`)
    console.log(`📈 Content breakdown: ${JSON.stringify(result.content)}`)
    
    // Exit with appropriate code
    if (result.errors > 0) {
      console.error('❌ Generation completed with errors')
      process.exit(1)
    }
    
    if (result.created === 0) {
      console.warn('⚠️ No content was created')
      process.exit(2)
    }
    
    console.log('🎉 River feed is now ready!')
    
  } catch (error) {
    console.error('❌ Initial river generation failed:', error)
    process.exit(1)
  }
}

// ========================================
// CLI Entry Point
// ========================================

if (require.main === module) {
  main().catch(error => {
    console.error('CLI execution failed:', error)
    process.exit(1)
  })
}
