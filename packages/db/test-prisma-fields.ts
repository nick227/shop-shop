import { prisma } from './src/client.js'

const stores = await prisma.store.findMany({ take: 1 })

console.log('Raw Prisma query returns these fields:')
console.log(Object.keys(stores[0]).sort())

await prisma.$disconnect()

