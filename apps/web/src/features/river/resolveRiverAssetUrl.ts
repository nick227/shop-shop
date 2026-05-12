/** Same origin normalization as {@link ApiClient} base URL (no `/api/v1` suffix). */
function getApiOrigin(): string {
  const baseUrl = import.meta.env.VITE_API_URL || ''
  const origin = (baseUrl || 'http://localhost:3005').replace(/\/$/, '')
  return origin.replace(/\/api\/v1\/?$/i, '')
}

/**
 * Turn API-relative asset paths into absolute URLs so `<img src>` hits the API host
 * (Vite dev server would otherwise resolve `/uploads/...` against the web origin).
 */
export function resolveRiverAssetUrl(url: string | undefined | null): string | undefined {
  if (url === undefined || url === null) return undefined
  const u = String(url).trim()
  if (u === '') return undefined
  if (u.startsWith('blob:') || u.startsWith('data:')) return u
  if (/^https?:\/\//i.test(u)) return u
  if (u.startsWith('//')) return u

  const origin = getApiOrigin()
  const path = u.startsWith('/') ? u : `/${u}`
  return `${origin}${path}`
}
