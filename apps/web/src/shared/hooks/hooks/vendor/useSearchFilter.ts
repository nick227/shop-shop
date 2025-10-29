/**
 * useSearchFilter - Generic search filter hook;
 */
import { useState, useMemo } from 'react'

export function useSearchFilter<T extends Record<string, unknown>>(
  items: T[],
  searchFields: (keyof T)[]
) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const lowerQuery = query.toLowerCase()
    
    return items.filter((item) =>
      searchFields.some((field) => {
        const value = item[field]
        if (value == undefined) return false;
        return value.toString().toLowerCase().includes(lowerQuery)
      })
    )
  }, [items, query, searchFields])

  return {
    query,
    setQuery,
    filtered,
    hasResults: filtered.length > 0,
    isSearching: query.trim().length > 0}
}

