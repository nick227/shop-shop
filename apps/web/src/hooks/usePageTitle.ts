import { useEffect } from 'react'

const BRAND_NAME = 'ShopShop'
const MAX_TITLE_LENGTH = 60

export type TitleSegment = string | undefined | null

export function usePageTitle(...segments: TitleSegment[]) {
  useEffect(() => {
    const filtered = segments.filter(Boolean) as string[]
    if (filtered.length === 0) return
    const title = filtered.join(' | ')
    document.title =
      title.length > MAX_TITLE_LENGTH ? title.slice(0, MAX_TITLE_LENGTH - 3) + '...' : title
  }, [...segments])
}

export function setPageTitle(...segments: TitleSegment[]) {
  const filtered = segments.filter(Boolean) as string[]
  if (filtered.length === 0) return
  const title = filtered.join(' | ')
  document.title =
    title.length > MAX_TITLE_LENGTH ? title.slice(0, MAX_TITLE_LENGTH - 3) + '...' : title
}

export { BRAND_NAME }
