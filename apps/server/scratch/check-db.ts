import { prisma } from '../src/client.js'

async function main() {
  const austinStores = await prisma.store.findMany({
    where: {
      OR: [
        { name: { contains: 'Austin', mode: 'insensitive' } },
        { addressCity: { contains: 'Austin', mode: 'insensitive' } }
      ]
    }
  })
  
  const pizzaProducts = await prisma.item.findMany({
    where: {
      OR: [
        { title: { contains: 'Pizza', mode: 'insensitive' } },
        { description: { contains: 'Pizza', mode: 'insensitive' } }
      ]
    }
  })

  console.log('AUSTIN_STORES_COUNT:', austinStores.length)
  austinStores.forEach(s => console.log(`- ${s.name} (City: ${s.addressCity})`))
  
  console.log('PIZZA_PRODUCTS_COUNT:', pizzaProducts.length)
  pizzaProducts.forEach(p => console.log(`- ${p.title}`))
}

main().catch(console.error).finally(() => prisma.$disconnect())
