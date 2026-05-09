/**
 * Resolve stored media URLs for use in <img src> / <video src>.
 * Relative paths load against the SPA origin and break unless prefixed with the API base.
 */
import { apiPath } from '@shared/lib/auth/authFetch'

export function resolveBrowserAssetUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed

  let u = trimmed
  if (u.startsWith('https:/') && !u.startsWith('https://')) {
    u = u.replace(/^https:\//, 'https://')
  } else if (u.startsWith('http:/') && !u.startsWith('http://')) {
    u = u.replace(/^http:\//, 'http://')
  }

  if (/^https?:\/\//i.test(u) || u.startsWith('data:') || u.startsWith('blob:') || u.startsWith('//')) {
    return u
  }

  const path = u.startsWith('/') ? u : `/${u}`
  return apiPath(path)
}
