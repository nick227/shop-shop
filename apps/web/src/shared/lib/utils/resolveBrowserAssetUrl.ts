import { getApiBaseUrl } from '@shared/lib/apiBaseUrl'

const ABSOLUTE = /^(https?:\/\/|data:|blob:|\/\/)/i
const API_PATH = /^\/(uploads|api)(\/|$)/i

/**
 * The one place stored media URLs become browser URLs for `<img src>` / `<video src>`.
 * API-hosted paths such as `/uploads/...` go to the API host. Other root-relative paths,
 * such as `/editorial/...`, are assets bundled with the web app and stay on its origin.
 */
export function resolveBrowserAssetUrl(url: string): string
export function resolveBrowserAssetUrl(url: string | null | undefined): string | undefined
export function resolveBrowserAssetUrl(url: string | null | undefined): string | undefined {
  if (url === null || url === undefined) return undefined
  const trimmed = url.trim()
  if (!trimmed) return trimmed

  // Some stored URLs lost a slash: "https:/host/...".
  const repaired = trimmed.replace(/^(https?):\/(?!\/)/i, '$1://')
  if (ABSOLUTE.test(repaired)) return repaired

  if (repaired.startsWith('/') && !API_PATH.test(repaired)) return repaired
  const path = repaired.startsWith('/') ? repaired : `/${repaired}`
  return `${getApiBaseUrl()}${path}`
}
