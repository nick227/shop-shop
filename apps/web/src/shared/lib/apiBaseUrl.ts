/**
 * API origin without a trailing slash or `/api` suffix. Empty in dev without VITE_API_URL,
 * where same-origin requests go through the Vite proxy to the API.
 */
export function getApiBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL
  if (!url && import.meta.env.PROD) {
    throw new Error('VITE_API_URL is required in production builds')
  }
  const fallback = import.meta.env.DEV ? '' : 'http://localhost:3005'
  const origin = url ? String(url) : fallback
  return origin.replace(/\/$/, '').replace(/\/api(?:\/v1)?$/i, '')
}
