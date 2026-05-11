import { PrismaClient } from '@packages/db/generated/client'
const prisma = new PrismaClient()

async function checkMediaUrls() {
  const posts = await prisma.post.findMany({
    take: 5,
    select: {
      id: true,
      content: true,
      mediaUrls: true,
      store: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  
  console.log('=== POSTS MEDIA URLS CHECK ===')
  posts.forEach((post, index) => {
    console.log(`Post ${index + 1}: ${post.id}`)
    console.log(`Store: ${post.store?.name || 'Unknown'}`)
    console.log(`  Content: ${post.content?.substring(0, 50)}...`)
    console.log(`  MediaUrls Type: ${typeof post.mediaUrls}`)
    console.log(`  MediaUrls Value: ${JSON.stringify(post.mediaUrls, null, 2)}`)
    console.log(`  Has Media: ${post.mediaUrls && post.mediaUrls.length > 0 ? 'YES' : 'NO'}`)
    console.log('---')
  })
  
  await prisma.$disconnect()
}

checkMediaUrls().catch(console.error)
