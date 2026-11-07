import { resolveBrowserAssetUrl } from '@shared/lib/utils/resolveBrowserAssetUrl'

const STOCK = /picsum\.photos|placehold\.co|unsplash\.com|images\.unsplash|loremflickr|placeholder\.com|via\.placeholder/i

/** Merchant and product photos only. Random stock hosts become a branded fallback. */
export function realPhoto(url: string | undefined | null): string | undefined {
  const value = url?.trim()
  if (!value || STOCK.test(value)) return undefined
  const editorial = value.indexOf('/editorial/')
  if (editorial >= 0) return value.slice(editorial)
  return resolveBrowserAssetUrl(value)
}
