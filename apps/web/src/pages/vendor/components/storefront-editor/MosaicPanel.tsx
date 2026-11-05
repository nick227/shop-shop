/**
 * Media mosaic: the product that leads the carousel, and the photo, video and product tiles beside it.
 */
import { Film, ImageIcon, Package } from 'lucide-react'
import { STOREFRONT_LIMITS, type MosaicTile } from '@packages/shared/storefront'
import { itemImage } from '@features/storefront/components/ProductTile'
import { Field, OrderedRow, PanelSection, UploadButton, inputClass, moveInList } from './controls'
import type { PanelProps } from './types'

export function MosaicPanel({ storeId, draft, update, items, media, onMediaChanged }: PanelProps) {
  const tiles = draft.mosaic.tiles
  const setTiles = (next: MosaicTile[]) => update((d) => ({ ...d, mosaic: { ...d.mosaic, tiles: next } }))
  const full = tiles.length >= STOREFRONT_LIMITS.mosaicTiles
  const usedMedia = new Set(tiles.flatMap((t) => (t.type === 'media' ? [t.mediaId] : [])))
  const usedItems = new Set(tiles.flatMap((t) => (t.type === 'item' ? [t.itemId] : [])))
  const pictured = items.filter((item) => itemImage(item))
  const mediaById = new Map(media.map((m) => [m.id, m]))
  const itemsById = new Map(items.map((i) => [i.id, i]))

  const describe = (tile: MosaicTile) => {
    if (tile.type === 'item') {
      const item = itemsById.get(tile.itemId)
      return { label: item?.title ?? 'Removed item', thumb: item ? itemImage(item) : undefined, icon: Package }
    }
    const m = mediaById.get(tile.mediaId)
    return { label: m?.kind === 'VIDEO' ? 'Video' : 'Photo', thumb: m?.kind === 'VIDEO' ? undefined : m?.url, icon: m?.kind === 'VIDEO' ? Film : ImageIcon }
  }

  return (
    <div className="space-y-5">
      <PanelSection title="Carousel" description="Products shoppers can swipe through and add right away. Your pick leads; popular items follow.">
        <Field label="Lead product">
          {(id) => (
            <select
              id={id}
              className={inputClass}
              value={draft.mosaic.featuredItemId ?? ''}
              onChange={(e) => update((d) => ({ ...d, mosaic: { ...d.mosaic, featuredItemId: e.target.value || null } }))}
            >
              <option value="">Most popular first</option>
              {pictured.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          )}
        </Field>
        {pictured.length === 0 ? (
          <p className="text-xs text-muted-foreground">Add photos to your items to fill the carousel.</p>
        ) : null}
      </PanelSection>

      <PanelSection
        title="Tiles"
        description={`Up to ${STOREFRONT_LIMITS.mosaicTiles} photos, videos or products beside the carousel, in this order.`}
      >
        {tiles.length > 0 ? (
          <ol className="space-y-2">
            {tiles.map((tile, index) => {
              const { label, thumb, icon: Icon } = describe(tile)
              return (
                <OrderedRow
                  key={tile.type === 'item' ? `i-${tile.itemId}` : `m-${tile.mediaId}`}
                  label={label}
                  index={index}
                  count={tiles.length}
                  onMove={(offset) => setTiles(moveInList(tiles, index, offset))}
                  onRemove={() => setTiles(tiles.filter((_, i) => i !== index))}
                >
                  <div className="flex items-center gap-2">
                    {thumb ? (
                      <img src={thumb} alt="" className="h-9 w-9 rounded object-cover" />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                      </span>
                    )}
                    <span className="truncate text-sm">{label}</span>
                  </div>
                </OrderedRow>
              )
            })}
          </ol>
        ) : (
          <p className="text-xs text-muted-foreground">No tiles yet. The carousel fills the space on its own.</p>
        )}

        {full ? null : (
          <div className="space-y-3">
            {media.some((m) => !usedMedia.has(m.id)) ? (
              <div className="space-y-1.5">
                <p className="text-xs font-medium">Your photos and videos</p>
                <ul className="grid grid-cols-4 gap-1.5">
                  {media
                    .filter((m) => !usedMedia.has(m.id))
                    .map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => setTiles([...tiles, { type: 'media', mediaId: m.id }])}
                          aria-label={`Add ${m.kind === 'VIDEO' ? 'video' : 'photo'} to the mosaic`}
                          className="relative block aspect-square w-full overflow-hidden rounded-md bg-muted ring-1 ring-border hover:ring-foreground/50"
                        >
                          {m.kind === 'VIDEO' ? (
                            <Film className="absolute inset-0 m-auto h-5 w-5 text-muted-foreground" aria-hidden />
                          ) : (
                            <img src={m.url} alt="" className="h-full w-full object-cover" />
                          )}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <UploadButton
                storeId={storeId}
                onUploaded={(uploaded) => {
                  const room = STOREFRONT_LIMITS.mosaicTiles - tiles.length
                  setTiles([...tiles, ...uploaded.slice(0, room).map((m): MosaicTile => ({ type: 'media', mediaId: m.id }))])
                  onMediaChanged()
                }}
              />
              <select
                aria-label="Add a product tile"
                className={`${inputClass} w-auto flex-1`}
                value=""
                onChange={(e) => e.target.value && setTiles([...tiles, { type: 'item', itemId: e.target.value }])}
              >
                <option value="">Add a product tile…</option>
                {pictured
                  .filter((item) => !usedItems.has(item.id))
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}
      </PanelSection>
    </div>
  )
}
