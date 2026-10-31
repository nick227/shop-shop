import { authDelete, authFetch, authPost } from '@shared/lib/auth/authFetch'
import { resolveBrowserAssetUrl } from '@shared/lib/utils/resolveBrowserAssetUrl'

export interface StorePhoto {
  id: string
  url: string
}

interface MediaRow {
  id?: unknown
  url?: unknown
  kind?: unknown
}

function toPhoto(row: MediaRow): StorePhoto | undefined {
  const isImage = row.kind === 'IMAGE' || row.kind === undefined
  if (!isImage || typeof row.id !== 'string' || typeof row.url !== 'string' || row.url === '') return undefined
  return { id: row.id, url: resolveBrowserAssetUrl(row.url) }
}

async function readError(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => ({}))) as { error?: string }
  return body.error || fallback
}

export async function listStorePhotos(storeId: string): Promise<StorePhoto[]> {
  const response = await authFetch<{ data?: MediaRow[] }>(`/api/media?storeId=${encodeURIComponent(storeId)}`)
  if (!response.ok) throw new Error(await readError(response, 'Could not load photos'))
  const payload = await response.json()
  const rows = Array.isArray(payload.data) ? payload.data : []
  return rows.flatMap((row) => {
    const photo = toPhoto(row)
    return photo ? [photo] : []
  })
}

export async function uploadStorePhoto(storeId: string, file: File): Promise<void> {
  const body = new FormData()
  body.append('file', file)
  body.append('storeId', storeId)
  const response = await authPost('/api/media/upload', body)
  if (!response.ok) throw new Error(await readError(response, 'Upload failed'))
}

export async function deleteStorePhoto(id: string): Promise<void> {
  const response = await authDelete(`/api/media/${id}`)
  if (!response.ok) throw new Error(await readError(response, 'Could not remove photo'))
}
