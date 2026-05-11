import { PrismaClient } from '@packages/db/generated/client/index.js'

async function debugRiverMedia() {
  const prisma = new PrismaClient()
  
  try {
    // Get all posts with their mediaUrls
    const posts = await prisma.post.findMany({
      take: 5,
      select: {
        id: true,
        content: true,
        mediaUrls: true,
        store: {
          select: {
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log('=== River Posts Debug ===')
    posts.forEach(post => {
      console.log(`\n=== Post ${post.id} ===`)
      console.log(`Store: ${post.store.name}`)
      console.log(`Content: ${post.content}`)
      console.log(`MediaUrls Type: ${typeof post.mediaUrls}`)
      console.log(`MediaUrls Value:`, post.mediaUrls)
      console.log(`MediaUrls Length: ${Array.isArray(post.mediaUrls) ? post.mediaUrls.length : 'Not an array'}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugRiverMedia()
