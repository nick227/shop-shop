import { PrismaClient } from './generated/client/index.js'
import { orderDeliveryCoordsGuard } from './order-create-guard.extension.js'

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  }).$extends(orderDeliveryCoordsGuard)
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma

