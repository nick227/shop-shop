import { PrismaClient } from './generated/client/index.js'
import { orderDeliveryCoordsGuard } from './order-create-guard.extension.js'

export function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  }).$extends(orderDeliveryCoordsGuard)
}

/** Use this for services that receive the shared `prisma` singleton (includes Order delivery-coords guard). */
export type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined
}

export const prisma: ExtendedPrismaClient = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma

