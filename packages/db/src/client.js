import { PrismaClient } from './generated/client/index.js';
import { orderDeliveryCoordsGuard } from './order-create-guard.extension.js';
export function createPrismaClient() {
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    }).$extends(orderDeliveryCoordsGuard);
}
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
export default prisma;
