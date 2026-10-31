import { useEffect, useState } from 'react'
import { hasText, type StoreFieldProps } from './storeFieldProps'
import { StoreSectionTitle } from './StoreSectionTitle'
import { deleteStorePhoto, listStorePhotos, uploadStorePhoto, type StorePhoto } from './storePhotoApi'

interface StorePhotosSectionProps extends StoreFieldProps {
  readonly storeId?: string
  readonly pendingFiles: readonly File[]
  readonly onPendingFiles: (files: File[]) => void
}

export function StorePhotosSection({
  formData,
  onChange,
  storeId,
  pendingFiles,
  onPendingFiles,
}: StorePhotosSectionProps) {
  const [photos, setPhotos] = useState<StorePhoto[]>([])
  const [pendingPreviews, setPendingPreviews] = useState<{ file: File; url: string }[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!storeId) return
    let cancelled = false
    void listStorePhotos(storeId)
      .then((rows) => {
        if (!cancelled) setPhotos(rows)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load photos')
      })
    return () => {
      cancelled = true
    }
  }, [storeId])

  useEffect(() => {
    const next = pendingFiles.map((file) => ({ file, url: URL.createObjectURL(file) }))
    setPendingPreviews(next)
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
    if (!storeId) {
      onPendingFiles([...pendingFiles, ...images])
      return
    }
    setBusy(true)
    try {
      for (const file of images) await uploadStorePhoto(storeId, file)
      const rows = await listStorePhotos(storeId)
      setPhotos(rows)
      if (!hasText(formData.imageUrl) && rows[0]) onChange('imageUrl', rows[0].url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  async function removeSaved(photo: StorePhoto) {
    if (!storeId) return
    setBusy(true)
    setError('')
    try {
      await deleteStorePhoto(photo.id)
      const rows = await listStorePhotos(storeId)
      setPhotos(rows)
      if (formData.imageUrl === photo.url) onChange('imageUrl', rows[0]?.url ?? '')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not remove photo')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-3">
      <StoreSectionTitle>Photos</StoreSectionTitle>
      <div
        className="rounded-md border border-border p-3"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          void addFiles(event.dataTransfer.files)
        }}
      >
      <div className="flex flex-wrap gap-3">
        {photos.map((photo, index) => (
          <PhotoTile
            key={photo.id}
            url={photo.url}
            label={`Remove photo ${index + 1}`}
            disabled={busy}
            onRemove={() => void removeSaved(photo)}
          />
        ))}
        {pendingPreviews.map((item, index) => (
          <PhotoTile
            key={item.url}
            url={item.url}
            label={`Remove photo ${photos.length + index + 1}`}
            disabled={busy}
            onRemove={() => onPendingFiles(pendingFiles.filter((file) => file !== item.file))}
          />
        ))}
        <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-md border border-dashed border-border text-center text-sm text-muted-foreground hover:text-foreground">
          {busy ? 'Saving...' : 'Add photo'}
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
    </section>
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
