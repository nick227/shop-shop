import { prisma } from '@packages/db';

async function checkStores() {
  try {
    // Check all stores
    const stores = await prisma.store.findMany({
      select: { 
        id: true, 
        name: true, 
        status: true,
        isPublished: true,
        _count: { select: { items: true } }
      }
    });
    
    console.log(`Found ${stores.length} stores:`);
    stores.forEach(store => {
      console.log(`- ${store.name} (${store.id}) - status: ${store.status} - published: ${store.isPublished} - items: ${store._count.items}`);
    });
    
    // Check if there are any items at all
    const totalItems = await prisma.item.count();
    console.log(`\nTotal items in database: ${totalItems}`);
    
    // If there are items, show some examples
    if (totalItems > 0) {
      const sampleItems = await prisma.item.findMany({
        take: 5,
        select: { id: true, title: true, storeId: true, isActive: true }
      });
      console.log('\nSample items:');
      sampleItems.forEach(item => {
        console.log(`- ${item.title} in store ${item.storeId} (active: ${item.isActive})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStores();
