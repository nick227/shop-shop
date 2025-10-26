import { prisma } from './dist/client.js'

const stores = await prisma.store.findMany({
  select: {
    name: true,
    latitude: true,
    longitude: true,
    addressCity: true,
    addressState: true,
    addressZip: true
  }
})

stores.forEach(s => {
  console.log(`${s.name}:`)
  console.log(`  Coords: ${s.latitude}, ${s.longitude}`)
  console.log(`  Address: ${s.addressCity}, ${s.addressState} ${s.addressZip}\n`)
})

await prisma.$disconnect()

