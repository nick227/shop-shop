import { useEffect, useRef, useState } from 'react'
import { authDelete, authFetch, authPost } from '@shared/lib/auth/authFetch'
import { resolveBrowserAssetUrl } from '@shared/lib/utils/resolveBrowserAssetUrl'

interface ProductMediaGridProps {
  readonly storeId?: string
  readonly itemId?: string
  readonly imageUrl: string
  readonly onImageUrl: (url: string) => void
  readonly pendingFiles: readonly File[]
  readonly onPendingFiles: (files: File[]) => void
}

interface Photo {
  id: string
  url: string
}

export function ProductMediaGrid({
  storeId,
  itemId,
  imageUrl,
  onImageUrl,
  pendingFiles,
  onPendingFiles,
}: ProductMediaGridProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const imageUrlRef = useRef(imageUrl)
  imageUrlRef.current = imageUrl

  useEffect(() => {
    if (!storeId || !itemId) return
    let cancelled = false
    void listItemPhotos(storeId, itemId)
      .then((rows) => {
        if (cancelled) return
        setPhotos(rows)
        if (!imageUrlRef.current && rows[0]) onImageUrl(rows[0].url)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load photos')
      })
    return () => {
      cancelled = true
    }
  }, [storeId, itemId])

  useEffect(() => {
    const next = pendingFiles.map((file) => ({ file, url: URL.createObjectURL(file) }))
    setPreviews(next)
    return () => {
      for (const item of next) URL.revokeObjectURL(item.url)
    }
  }, [pendingFiles])

  async function addFiles(list: FileList | readonly File[]) {
    const images = [...list].filter((file) => file.type.startsWith('image/'))
    if (images.length === 0) {
      if (list.length > 0) setError('Choose an image')
      return
    }
    setError('')
    if (!storeId || !itemId) {
      onPendingFiles([...pendingFiles, ...images])
      return
    }
    setBusy(true)
    try {
      for (const file of images) await uploadItemPhoto(storeId, itemId, file)
      const rows = await listItemPhotos(storeId, itemId)
      setPhotos(rows)
      if (!imageUrl && rows[0]) onImageUrl(rows[0].url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  async function removeSaved(photo: Photo) {
    if (!storeId || !itemId) return
    setBusy(true)
    setError('')
    try {
      await deleteItemPhoto(photo.id)
      const rows = await listItemPhotos(storeId, itemId)
      setPhotos(rows)
      if (imageUrl === photo.url) onImageUrl(rows[0]?.url ?? '')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not remove photo')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-[repeat(auto-fill,6rem)] gap-3">
        {photos.map((photo, index) => (
          <PhotoTile
            key={photo.id}
            url={photo.url}
            label={`Remove photo ${index + 1}`}
            disabled={busy}
            onRemove={() => void removeSaved(photo)}
          />
        ))}
        {previews.map((item, index) => (
          <PhotoTile
            key={item.url}
            url={item.url}
            label={`Remove photo ${photos.length + index + 1}`}
            disabled={busy}
            onRemove={() => onPendingFiles(pendingFiles.filter((file) => file !== item.file))}
          />
        ))}
        <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-md border border-dashed border-border text-center text-sm text-muted-foreground hover:text-foreground">
          {busy ? 'Saving…' : 'Add'}
          <input
            aria-label="Add photo"
            type="file"
            accept="image/*"
            multiple
            disabled={busy}
            className="sr-only"
            onChange={(event) => {
              const files = event.target.files
              if (files) void addFiles(files)
              event.target.value = ''
            }}
          />
        </label>
      </div>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

function PhotoTile({
  url,
  label,
  disabled,
  onRemove,
}: {
  readonly url: string
  readonly label: string
  readonly disabled: boolean
  readonly onRemove: () => void
}) {
  return (
    <div className="relative h-24 w-24 overflow-hidden rounded-md bg-muted">
      <img src={url} alt="" className="h-full w-full object-cover" />
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={onRemove}
        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-sm leading-none"
      >
        ×
      </button>
    </div>
  )
}

async function listItemPhotos(storeId: string, itemId: string): Promise<Photo[]> {
  const params = new URLSearchParams({ storeId, itemId })
  const response = await authFetch<{ data?: { id?: unknown; url?: unknown; kind?: unknown; sortIndex?: unknown }[] }>(
    `/api/media?${params.toString()}`,
  )
  if (!response.ok) throw new Error(await readError(response, 'Could not load photos'))
  const payload = await response.json()
  const rows = Array.isArray(payload.data) ? payload.data : []
  return rows.flatMap((row) => {
    if (row.kind !== 'IMAGE' && row.kind !== undefined) return []
    if (typeof row.id !== 'string' || typeof row.url !== 'string' || row.url === '') return []
    const sort = typeof row.sortIndex === 'number' ? row.sortIndex : 0
    return [{ id: row.id, url: resolveBrowserAssetUrl(row.url), sort }]
  }).sort((a, b) => a.sort - b.sort).map(({ id, url }) => ({ id, url }))
}

export async function uploadItemPhoto(storeId: string, itemId: string, file: File): Promise<string> {
  const body = new FormData()
  body.append('file', file)
  body.append('storeId', storeId)
  body.append('itemId', itemId)
  const response = await authPost<{ url?: string }>('/api/media/upload', body)
  if (!response.ok) throw new Error(await readError(response, 'Upload failed'))
  const payload = await response.json()
  return typeof payload.url === 'string' ? resolveBrowserAssetUrl(payload.url) : ''
}

async function deleteItemPhoto(id: string): Promise<void> {
  const response = await authDelete(`/api/media/${id}`)
  if (!response.ok) throw new Error(await readError(response, 'Could not remove photo'))
}

async function readError(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => ({}))) as { error?: string }
  return body.error || fallback
}
