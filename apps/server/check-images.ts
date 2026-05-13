
import { prisma } from '@packages/db';

async function checkProductImages() {
  try {
    const items = await prisma.item.findMany({
      take: 20,
      include: {
        media: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Checking latest 20 items:`);
    for (const item of items) {
      console.log(`\nItem: ${item.title} (ID: ${item.id})`);
      console.log(`- imageUrl (field): ${item.imageUrl || 'None'}`);
      console.log(`- Media Assets count: ${item.media.length}`);
      item.media.forEach((m, i) => {
        console.log(`  [${i}] kind: ${m.kind}, url: ${m.url}`);
      });
      
      // Check activation
      const imageCount = await prisma.mediaAsset.count({ where: { itemId: item.id, kind: 'IMAGE' } });
      const mediaCount = await prisma.mediaAsset.count({ where: { itemId: item.id } });
      const hasRequiredFields = !!(item.title && item.price && item.price.gt(0));
      const isActive = item.isActive;
      
      console.log(`- Activation: hasImage=${imageCount >= 1}, hasAnyMedia=${mediaCount >= 1}, hasRequiredFields=${hasRequiredFields}, isActive=${isActive}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductImages();
