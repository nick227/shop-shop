/** A store's delivery zones and the vendor's "would this address get delivery?" check. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authDelete, authGet, authPatch, authPost } from '@shared/lib/auth/authFetch'
import type { ZoneDto } from './zoneGeometry'

const key = (storeId: string) => ['delivery-zones', storeId] as const

async function failure(response: Response, fallback: string): Promise<Error> {
  const body = (await response.json().catch(() => ({}))) as { error?: string; details?: { message?: string }[] }
  return new Error(body.details?.[0]?.message ?? body.error ?? fallback)
}

export function useDeliveryZones(storeId: string | undefined) {
  return useQuery({
    queryKey: key(storeId ?? ''),
    enabled: Boolean(storeId),
    queryFn: async (): Promise<ZoneDto[]> => {
      const response = await authGet(`/api/stores/${storeId}/delivery-zones`)
      if (!response.ok) throw await failure(response, 'Couldn’t load delivery zones')
      return ((await response.json()) as { zones?: ZoneDto[] }).zones ?? []
    },
  })
}

export interface ZoneInput {
  readonly name: string
  readonly polygonJson: unknown
  readonly baseFee: number
  readonly minOrder: number | null
  readonly isActive?: boolean
  readonly priority?: number
}

export function useSaveZone(storeId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: Partial<ZoneInput> }) => {
      const response = id ? await authPatch(`/api/delivery-zones/${id}`, input) : await authPost('/api/delivery-zones', { storeId, ...input })
      if (!response.ok) throw await failure(response, 'Couldn’t save the zone')
      return ((await response.json()) as { zone: ZoneDto }).zone
    },
    onSettled: () => client.invalidateQueries({ queryKey: key(storeId) }),
  })
}

export function useDeleteZone(storeId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await authDelete(`/api/delivery-zones/${id}`)
      if (!response.ok && response.status !== 204) throw await failure(response, 'Couldn’t delete the zone')
    },
    onSettled: () => client.invalidateQueries({ queryKey: key(storeId) }),
  })
}

export interface DeliveryPreview {
  readonly destination: { lat: number; lng: number; approximate: boolean } | null
  readonly eligibility:
    | { available: true; fee: number; minimum: number | null; distanceMiles: number | null; zoneName: string | null }
    | { available: false; code: string; message: string; minimum: number | null }
}

export function useDeliveryPreview(storeId: string) {
  return useMutation({
    mutationFn: async (address: { line1: string; city: string; state: string; postalCode: string }) => {
      const response = await authPost(`/api/stores/${storeId}/delivery-preview`, { address })
      if (!response.ok) throw await failure(response, 'Couldn’t check that address')
      return (await response.json()) as DeliveryPreview
    },
  })
}
