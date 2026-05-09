import { prisma } from '@packages/db';

async function checkItems() {
  const storeId = '182584b6-1b7d-4168-b68c-29acab85f764';
  
  try {
    // Check all items in the store
    const items = await prisma.item.findMany({
      where: { storeId },
      select: { 
        id: true, 
        title: true, 
        isActive: true, 
        isSoldOut: true,
        price: true
      }
    });
    
    console.log(`Found ${items.length} items in store ${storeId}:`);
    items.forEach(item => {
      console.log(`- ${item.title} (active: ${item.isActive}, soldOut: ${item.isSoldOut})`);
    });
    
    // Check if any items have orders
    const itemsWithOrders = await prisma.item.findMany({
      where: { 
        storeId,
        orderItems: {
          some: {
            order: {
              status: { not: 'CANCELED' }
            }
          }
        }
      },
      select: { id: true, title: true }
    });
    
    console.log(`\nItems with non-canceled orders: ${itemsWithOrders.length}`);
    itemsWithOrders.forEach(item => {
      console.log(`- ${item.title}`);
    });
    
    // Check the exact query that the analytics uses
    const analyticsQuery = await prisma.$queryRaw`
      SELECT
        i.id AS itemId,
        i.title,
        i.isActive,
        i.isSoldOut,
        COALESCE(SUM(oi.quantity), 0) AS unitsSold
      FROM Item i
      LEFT JOIN OrderItem oi ON i.id = oi.itemId
      LEFT JOIN \`Order\` o ON oi.orderId = o.id AND o.status != 'CANCELED'
      WHERE i.storeId = ${storeId}
      GROUP BY i.id, i.title, i.isActive, i.isSoldOut
      HAVING COALESCE(SUM(oi.quantity), 0) > 0 OR i.isActive = TRUE
    `;
    
    console.log(`\nAnalytics query results: ${analyticsQuery.length}`);
    console.log(analyticsQuery);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkItems();
