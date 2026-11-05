/**
 * useMenuSections - one store's menu sections, and the vendor's changes to them.
 *
 * `view: 'team'` is the vendor's whole menu: every section, hidden and empty ones included.
 * `view: 'shopper'` is what shoppers see: visible sections that hold something on sale. The server
 * answers the shopper view for anyone outside the store's team, whichever view is asked for.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authDelete, authGet, authPatch, authPost, authPut } from '@shared/lib/auth/authFetch'
import type { MenuSection } from '@shared/lib/menu/menuSections'
import { storeItemsQueryKey } from './vendor/useStoreItems'

export type MenuSectionsView = 'team' | 'shopper'

export const menuSectionsQueryKey = (storeId: string | undefined, view?: MenuSectionsView) =>
  view ? (['menu-sections', storeId, view] as const) : (['menu-sections', storeId] as const)

const sectionsPath = (storeId: string) => `/api/stores/${encodeURIComponent(storeId)}/menu-sections`

async function readError(response: { json: () => Promise<unknown> }, fallback: string): Promise<Error> {
  const body = (await response.json().catch(() => ({}))) as { error?: string }
  return new Error(body.error || fallback)
}

export function useMenuSections(storeId: string | undefined, options: { view: MenuSectionsView; enabled?: boolean }) {
  return useQuery({
    queryKey: menuSectionsQueryKey(storeId, options.view),
    queryFn: async (): Promise<MenuSection[]> => {
      const query = options.view === 'shopper' ? '?view=shopper' : ''
      const response = await authGet(`${sectionsPath(storeId!)}${query}`)
      if (!response.ok) throw await readError(response, 'Could not load the menu sections')
      const body = (await response.json()) as { data?: MenuSection[] }
      return body.data ?? []
    },
    enabled: !!storeId && (options.enabled ?? true),
  })
}

export interface MenuSectionDraft {
  readonly name?: string
  readonly description?: string | null
  readonly isVisible?: boolean
}

/** Create, change, reorder and delete sections. Every change refreshes both views of the menu. */
export function useMenuSectionMutations(storeId: string) {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: menuSectionsQueryKey(storeId) })

  const create = useMutation({
    mutationFn: async (draft: MenuSectionDraft & { name: string }): Promise<MenuSection> => {
      const response = await authPost(sectionsPath(storeId), draft)
      if (!response.ok) throw await readError(response, 'Could not add the section')
      return ((await response.json()) as { data: MenuSection }).data
    },
    onSettled: refresh,
  })

  const update = useMutation({
    mutationFn: async ({ id, ...draft }: MenuSectionDraft & { id: string }): Promise<MenuSection> => {
      const response = await authPatch(`${sectionsPath(storeId)}/${encodeURIComponent(id)}`, draft)
      if (!response.ok) throw await readError(response, 'Could not save the section')
      return ((await response.json()) as { data: MenuSection }).data
    },
    onSettled: refresh,
  })

  const reorder = useMutation({
    mutationFn: async (sectionIds: readonly string[]) => {
      const response = await authPut(`${sectionsPath(storeId)}/order`, { sectionIds })
      if (!response.ok) throw await readError(response, 'Could not reorder the sections')
    },
    // Show the new order at once; the refresh afterwards settles it either way.
    onMutate: (sectionIds) => {
      const key = menuSectionsQueryKey(storeId, 'team')
      const previous = queryClient.getQueryData<MenuSection[]>(key)
      if (previous) {
        const byId = new Map(previous.map((section) => [section.id, section]))
        queryClient.setQueryData(
          key,
          sectionIds.flatMap((id, sortIndex) => {
            const section = byId.get(id)
            return section ? [{ ...section, sortIndex }] : []
          }),
        )
      }
      return { previous }
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) queryClient.setQueryData(menuSectionsQueryKey(storeId, 'team'), context.previous)
    },
    onSettled: refresh,
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const response = await authDelete(`${sectionsPath(storeId)}/${encodeURIComponent(id)}`)
      if (!response.ok) throw await readError(response, 'Could not delete the section')
    },
    onSettled: () => {
      void refresh()
      // The section's items now sit outside any section.
      void queryClient.invalidateQueries({ queryKey: storeItemsQueryKey(storeId) })
    },
  })

  return { create, update, reorder, remove }
}
