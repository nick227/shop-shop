/**
 * Storefront data: the presentation config plus the live facts the page shows around it, and the
 * vendor editor's draft / publish / discard calls.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authGet, authPost, authPut } from '@shared/lib/auth/authFetch'
import type { StorefrontConfig } from '@packages/shared/storefront'
import type { StorefrontBundle } from './components/Merchandising'

export interface StorefrontMedia {
  readonly id: string
  readonly url: string
  /** `IMAGE` or `VIDEO`. */
  readonly kind: string
  readonly altText: string | null
}

export interface StorefrontDayHours {
  readonly open: string
  readonly close: string
  readonly closed?: boolean
}

export interface StorefrontOrdering {
  /** The same check checkout runs: false means checkout will refuse new orders. */
  readonly acceptingOrders: boolean
  readonly message: string | null
  readonly pickupEnabled: boolean
  readonly deliveryEnabled: boolean
  readonly prepTimeMin: number
  readonly deliveryCharge: number | null
  readonly deliveryDistanceMiles: number | null
}

export interface StorefrontHours {
  /** From the posted hours; informational, checkout does not enforce hours. */
  readonly isOpenNow: boolean
  readonly today: { readonly open: string; readonly close: string; readonly closed: boolean } | null
  readonly timezone: string | null
  readonly week: Record<string, StorefrontDayHours> | null
}

export interface StorefrontEditorState {
  readonly draft: StorefrontConfig
  readonly published: StorefrontConfig | null
  readonly publishedAt: string | null
  readonly hasUnpublishedChanges: boolean
}

export interface StorefrontData {
  readonly config: StorefrontConfig
  readonly view: 'draft' | 'published'
  readonly editor?: StorefrontEditorState
  readonly ordering: StorefrontOrdering
  readonly hours: StorefrontHours | null
  readonly popularItemIds: readonly string[]
  readonly media: readonly StorefrontMedia[]
  /** Active bundles shoppers can order whole, with prices resolved by the server. */
  readonly bundles: readonly StorefrontBundle[]
}

const base = (storeId: string) => `/api/stores/${encodeURIComponent(storeId)}/storefront`

export const storefrontQueryKey = (storeId: string | undefined, view: 'draft' | 'published' = 'published') =>
  ['storefront', storeId, view] as const
export const storefrontEditorQueryKey = (storeId: string | undefined) => ['storefront-editor', storeId] as const

async function failure(response: { json: () => Promise<unknown> }, fallback: string): Promise<Error> {
  const body = (await response.json().catch(() => ({}))) as { error?: string }
  return new Error(body.error ?? fallback)
}

export function useStorefront(storeId: string | undefined, options: { view?: 'draft' | 'published'; enabled?: boolean } = {}) {
  const view = options.view ?? 'published'
  return useQuery({
    queryKey: storefrontQueryKey(storeId, view),
    queryFn: async (): Promise<StorefrontData> => {
      const response = await authGet(`${base(storeId!)}${view === 'draft' ? '?view=draft' : ''}`)
      if (!response.ok) throw await failure(response, 'This storefront could not be loaded')
      return ((await response.json()) as { data: StorefrontData }).data
    },
    enabled: !!storeId && (options.enabled ?? true),
  })
}

export function useStorefrontEditor(storeId: string) {
  const queryClient = useQueryClient()
  const key = storefrontEditorQueryKey(storeId)

  const state = useQuery({
    queryKey: key,
    queryFn: async (): Promise<StorefrontEditorState> => {
      const response = await authGet(`${base(storeId)}/editor`)
      if (!response.ok) throw await failure(response, 'The storefront editor could not be loaded')
      return ((await response.json()) as { data: StorefrontEditorState }).data
    },
  })

  const settle = (next: StorefrontEditorState) => {
    queryClient.setQueryData(key, next)
    void queryClient.invalidateQueries({ queryKey: ['storefront', storeId] })
  }

  const saveDraft = useMutation({
    mutationFn: async (config: StorefrontConfig): Promise<StorefrontEditorState> => {
      const response = await authPut(`${base(storeId)}/draft`, { config })
      if (!response.ok) throw await failure(response, 'Your changes could not be saved')
      return ((await response.json()) as { data: StorefrontEditorState }).data
    },
    onSuccess: settle,
  })

  const publish = useMutation({
    mutationFn: async (): Promise<StorefrontEditorState> => {
      const response = await authPost(`${base(storeId)}/publish`)
      if (!response.ok) throw await failure(response, 'The storefront could not be published')
      return ((await response.json()) as { data: StorefrontEditorState }).data
    },
    onSuccess: settle,
  })

  const discard = useMutation({
    mutationFn: async (): Promise<StorefrontEditorState> => {
      const response = await authPost(`${base(storeId)}/discard`)
      if (!response.ok) throw await failure(response, 'Your changes could not be discarded')
      return ((await response.json()) as { data: StorefrontEditorState }).data
    },
    onSuccess: settle,
  })

  return { state, saveDraft, publish, discard }
}
