import { prisma } from './src/client.js'

const store = await prisma.store.findFirst({
  where: { name: 'Sushi Zen' }
})

console.log('Sushi Zen database data:')
console.log('  latitude:', store?.latitude?.toString())
console.log('  longitude:', store?.longitude?.toString())
console.log('  addressCity:', store?.addressCity)
console.log('  addressState:', store?.addressState)
console.log('  addressZip:', store?.addressZip)

await prisma.$disconnect()

