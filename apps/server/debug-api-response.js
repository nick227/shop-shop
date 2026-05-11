import { PrismaClient } from '@packages/db/generated/client'
const prisma = new PrismaClient()

async function debugApiResponse() {
  const posts = await prisma.post.findMany({
    take: 1,
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
  
  const post = posts[0]
  console.log('=== DEBUG API RESPONSE ===')
  console.log('Post ID:', post.id)
  console.log('Raw mediaUrls from DB:', JSON.stringify(post.mediaUrls, null, 2))
  
  // Simulate the fixed mapMediaJsonToRiver function
  function mapMediaJsonToRiver(raw) {
    if (!Array.isArray(raw)) return []
    const out = []
    for (const entry of raw) {
      // Handle string URLs (legacy format)
      if (typeof entry === 'string') {
        const url = entry
        if (url) {
          out.push({
            type: 'image',
            url,
            thumbnailUrl: undefined,
            width: undefined,
            height: undefined,
          })
        }
        continue
      }
      
      // Handle object media items
      if (!entry || typeof entry !== 'object') continue
      const o = entry
      const url = typeof o.url === 'string' ? o.url : ''
      if (!url) continue
      const kind = o.type === 'video' || o.type === 'youtube' ? 'video' : 'image'
      const thumb = o.thumbnail
      out.push({
        type: kind,
        url,
        thumbnailUrl: typeof thumb === 'string' ? thumb : undefined,
        width: typeof o.width === 'number' ? o.width : undefined,
        height: typeof o.height === 'number' ? o.height : undefined,
      })
    }
    return out
  }
  
  const mappedMedia = mapMediaJsonToRiver(post.mediaUrls)
  console.log('Mapped media:', JSON.stringify(mappedMedia, null, 2))
  console.log('Media length:', mappedMedia.length)
  console.log('Has media:', mappedMedia.length > 0)
  
  await prisma.$disconnect()
}

debugApiResponse().catch(console.error)
