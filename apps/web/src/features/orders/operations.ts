import { authFetch } from '@shared/lib/auth/authFetch'
export interface OperationalOrder {
  id: string
  storeId: string
  status: string
  deliveryType: string
  paymentStatus: string
  total: string | number
  version: number
  createdAt: string
  promisedReadyAt: string | null
  collectionCode: string | null
  refundState: string
  refundError?: string | null
  cancelReason?: string | null
  overdue: boolean
  canAdjustEstimate: boolean
  canRecoverRefund?: boolean
  exceptions: string[]
  owner?: string
  acceptanceDeadline: string | null
  allowedActions: { status: string; label: string; requiresPrepMinutes: boolean }[]
  items: { id: string; titleSnapshot: string; quantity: number; notes?: string | null }[]
  store: {
    name: string
    phone?: string | null
    addressLine1?: string | null
    addressCity?: string | null
  }
  events?: { id: string; status: string; note?: string | null; createdAt: string }[]
}
export async function orderRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await authFetch(`/api${path}`, options)
  const data = (await response.json()) as T & { error?: string; message?: string }
  if (!response.ok)
    throw new Error(data.error || data.message || 'Could not update order. Refresh and try again.')
  return data as T
}
export const orderTime = (date: string) =>
  new Date(date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
export const orderLabels: Record<string, string> = {
  PENDING_PAYMENT: 'Awaiting payment',
  PLACED: 'Needs acceptance',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY: 'Ready',
  OUT_FOR_DELIVERY: 'On the way',
  COMPLETED: 'Collected',
  DELIVERED: 'Delivered',
  CANCELED: 'Canceled',
}
