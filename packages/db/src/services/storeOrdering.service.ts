/**
 * Whether a store can take new orders right now.
 *
 * Two independent switches decide it:
 * - `status` is administrative (ACTIVE, PAUSED = suspended, DISABLED); only admins change it.
 * - `acceptingOrders` is the merchant's own pause.
 * A store must also be published. Checkout calls this again inside the order transaction.
 */
import { Prisma, type PrismaClient } from '../generated/client/index.js'

export type StoreOrderingBlock = 'NOT_FOUND' | 'DISABLED' | 'SUSPENDED' | 'NOT_PUBLISHED' | 'PAUSED_BY_STORE'

export interface StoreOrderingState {
  readonly status: 'ACTIVE' | 'PAUSED' | 'DISABLED' | string
  readonly isPublished: boolean
  readonly acceptingOrders: boolean
}

export const STORE_ORDERING_MESSAGES: Record<StoreOrderingBlock, string> = {
  NOT_FOUND: 'This store could not be found.',
  DISABLED: 'This store is unavailable.',
  SUSPENDED: 'This store is temporarily unavailable.',
  NOT_PUBLISHED: 'This store is not open yet.',
  PAUSED_BY_STORE: 'This store is not taking orders right now.',
}

export function storeOrderingBlock(store: StoreOrderingState | null | undefined): StoreOrderingBlock | null {
  if (!store) return 'NOT_FOUND'
  if (store.status === 'DISABLED') return 'DISABLED'
  if (store.status !== 'ACTIVE') return 'SUSPENDED'
  if (!store.isPublished) return 'NOT_PUBLISHED'
  if (!store.acceptingOrders) return 'PAUSED_BY_STORE'
  return null
}

export class StoreUnavailableError extends Error {
  readonly code: StoreOrderingBlock

  constructor(code: StoreOrderingBlock) {
    super(STORE_ORDERING_MESSAGES[code])
    this.name = 'StoreUnavailableError'
    this.code = code
  }
}

/** The slice of a Prisma client or transaction this check needs; extended clients fit too. */
interface StoreOrderingClient {
  readonly $queryRaw: PrismaClient['$queryRaw']
  readonly store: {
    readonly findUnique: (args: {
      where: { id: string }
      select: { status: true; isPublished: true; acceptingOrders: true }
    }) => PromiseLike<StoreOrderingState | null>
  }
}

/**
 * Throws StoreUnavailableError unless the store can take a new order.
 * With `lock`, the store row is share-locked until the surrounding transaction ends,
 * so a pause or suspension committed meanwhile waits for this order instead of racing it.
 */
export async function assertStoreAcceptsOrders(
  client: StoreOrderingClient,
  storeId: string,
  options: { readonly lock?: boolean } = {},
): Promise<void> {
  let store: StoreOrderingState | null
  if (options.lock) {
    const rows = await client.$queryRaw<{ status: string; isPublished: number | boolean; acceptingOrders: number | boolean }[]>(
      Prisma.sql`SELECT status, isPublished, acceptingOrders FROM Store WHERE id = ${storeId} LOCK IN SHARE MODE`,
    )
    const row = rows[0]
    store = row
      ? { status: row.status, isPublished: Boolean(row.isPublished), acceptingOrders: Boolean(row.acceptingOrders) }
      : null
  } else {
    store = await client.store.findUnique({
      where: { id: storeId },
      select: { status: true, isPublished: true, acceptingOrders: true },
    })
  }

  const block = storeOrderingBlock(store)
  if (block) throw new StoreUnavailableError(block)
}
