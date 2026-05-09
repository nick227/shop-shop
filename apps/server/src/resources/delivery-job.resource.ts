/** Minimal fields needed to map Prisma `DeliveryJob` → JSON (avoids importing runtime generated client in HTTP layer). */
export type DeliveryJobLike = Readonly<{
  id: string
  orderId: string
  storeId: string
  provider: string
  status: string
  providerExternalId: string | null
  trackingUrl: string | null
  providerStatus: string | null
  requestedByUserId: string | null
  canceledAt: Date | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}>

/** Safe HTTP shape: no raw `providerPayload` / provider blobs (admin/debug only elsewhere). */
export type DeliveryJobResponse = Readonly<{
  id: string
  orderId: string
  storeId: string
  provider: string
  status: string
  providerExternalId: string | null
  trackingUrl: string | null
  providerStatus: string | null
  requestedByUserId: string | null
  canceledAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}>

export function toDeliveryJobResponse(job: DeliveryJobLike): DeliveryJobResponse {
  return {
    id: job.id,
    orderId: job.orderId,
    storeId: job.storeId,
    provider: job.provider,
    status: job.status,
    providerExternalId: job.providerExternalId,
    trackingUrl: job.trackingUrl,
    providerStatus: job.providerStatus,
    requestedByUserId: job.requestedByUserId,
    canceledAt: job.canceledAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  }
}
