import { useQuery } from '@tanstack/react-query'

export interface TagItem {
  slug: string
  label: string
}

export interface TagGroup {
  category: string
  label: string
  target: string
  tags: TagItem[]
}

interface TagGroupsResponse {
  groups: TagGroup[]
}

interface UseTagGroupsParams {
  target?: 'STORE' | 'ITEM' | 'BOTH'
  categories?: string[]
  enabled?: boolean
}

export function useTagGroups({ target, categories, enabled = true }: UseTagGroupsParams = {}) {
  return useQuery<TagGroupsResponse, Error>({
    queryKey: ['tag-groups', target, categories],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (target) params.set('target', target)
      const res = await fetch(`/api/tags?${params}`)
      if (!res.ok) throw new Error('Failed to load filters')
      return res.json()
    },
    enabled,
    staleTime: 5 * 60_000, // tags rarely change — 5-minute cache
    select: (data) =>
      categories?.length
        ? { groups: data.groups.filter((g) => categories.includes(g.category)) }
        : data,
  })
}
