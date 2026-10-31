import { EnhancedMediaGalleryManager } from '@shared/ui/media'
import type { StoreFieldProps } from './storeFieldProps'

interface StorePhotosSectionProps extends StoreFieldProps {
  readonly isEdit: boolean
  readonly storeId?: string
  readonly pendingFiles: readonly File[]
  readonly onPendingFiles: (files: File[]) => void
}

export function StorePhotosSection({
  formData,
  onChange,
  isEdit,
  storeId,
  pendingFiles,
  onPendingFiles,
}: StorePhotosSectionProps) {
  return (
    <section className="space-y-6">
      <EnhancedMediaGalleryManager
        storeId={storeId}
        maxFiles={100}
        thumbnailUrl={formData.imageUrl}
        onThumbnailChange={(url) => onChange('imageUrl', url)}
        thumbnailLabel="Store thumbnail"
        pendingScopedMediaFiles={isEdit ? undefined : [...pendingFiles]}
        onPendingScopedMediaFilesChange={isEdit ? undefined : onPendingFiles}
      />
    </section>
  )
}
