/**
 * Store photos for the hero and the compact gallery strip.
 * The first photo leads the hero; the rest fill the gallery thumbs.
 */
import { Film, ImageIcon } from 'lucide-react'
import { PanelSection, UploadButton } from './controls'
import type { PanelProps } from './types'

export function PhotosPanel({ storeId, media, onMediaChanged }: PanelProps) {
  const photos = media.filter((m) => m.kind !== 'VIDEO')
  const videos = media.filter((m) => m.kind === 'VIDEO')

  return (
    <div className="space-y-5">
      <PanelSection
        title="Store photos"
        description="The first photo is the hero cover beside the map. The rest show as a compact gallery under the page."
      >
        {photos.length > 0 ? (
          <ul className="grid grid-cols-4 gap-1.5">
            {photos.map((m, index) => (
              <li key={m.id} className="relative aspect-square overflow-hidden rounded-md bg-muted ring-1 ring-border">
                <img src={m.url} alt="" className="h-full w-full object-cover" />
                {index === 0 ? (
                  <span className="absolute inset-x-0 bottom-0 bg-background/85 px-1 py-0.5 text-[0.65rem] font-semibold">
                    Hero
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No photos yet. Upload one to fill the hero.</p>
        )}
        <UploadButton storeId={storeId} onUploaded={() => onMediaChanged()} />
      </PanelSection>

      {videos.length > 0 ? (
        <PanelSection title="Videos" description="Kept with your media library. They are not shown in the gallery strip.">
          <ul className="space-y-1.5">
            {videos.map((m) => (
              <li key={m.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Film className="h-4 w-4" aria-hidden />
                Video
              </li>
            ))}
          </ul>
        </PanelSection>
      ) : null}

      {photos.length === 0 && videos.length === 0 ? (
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <ImageIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Item photos still show on the menu. These are the store’s own photos for the page.
        </p>
      ) : null}
    </div>
  )
}
