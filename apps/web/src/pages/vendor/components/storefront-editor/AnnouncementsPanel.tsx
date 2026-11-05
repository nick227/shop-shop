/**
 * Announcements: short panels of text, an image or a video, each optionally promoting one item.
 */
import { Plus } from 'lucide-react'
import { STOREFRONT_LIMITS, type AnnouncementKind, type StorefrontAnnouncement } from '@packages/shared/storefront'
import { Button } from '@shared/ui/primitives'
import { Choice, Field, OrderedRow, PanelSection, UploadButton, inputClass, moveInList } from './controls'
import type { PanelProps } from './types'

/** Panel ids only need to be unique within the store's list. */
const newId = () => globalThis.crypto?.randomUUID?.() ?? `a-${Date.now().toString(36)}`

export function AnnouncementsPanel({ storeId, draft, update, items, media, onMediaChanged }: PanelProps) {
  const panels = draft.announcements
  const setPanels = (next: StorefrontAnnouncement[]) => update((d) => ({ ...d, announcements: next }))
  const patch = (index: number, change: Partial<StorefrontAnnouncement>) =>
    setPanels(panels.map((panel, i) => (i === index ? { ...panel, ...change } : panel)))

  return (
    <PanelSection
      title="Announcements"
      description={`Up to ${STOREFRONT_LIMITS.announcements} panels in your accent color: a new dish, holiday hours, a catering offer.`}
    >
      <ol className="space-y-3">
        {panels.map((panel, index) => (
          <OrderedRow
            key={panel.id}
            label={panel.title || `Announcement ${index + 1}`}
            index={index}
            count={panels.length}
            onMove={(offset) => setPanels(moveInList(panels, index, offset))}
            onRemove={() => setPanels(panels.filter((_, i) => i !== index))}
          >
            <div className="space-y-2 pr-1">
              <Choice<AnnouncementKind>
                label="Panel type"
                value={panel.kind}
                onChange={(kind) => patch(index, { kind })}
                options={[
                  { id: 'text', label: 'Text' },
                  { id: 'image', label: 'Image' },
                  { id: 'video', label: 'Video' },
                ]}
              />
              <input
                aria-label="Title"
                className={inputClass}
                placeholder="Title"
                value={panel.title}
                maxLength={STOREFRONT_LIMITS.announcementTitle}
                onChange={(e) => patch(index, { title: e.target.value })}
              />
              <textarea
                aria-label="Message"
                className={`${inputClass} h-20 py-2`}
                placeholder="Message"
                value={panel.body}
                maxLength={STOREFRONT_LIMITS.announcementBody}
                onChange={(e) => patch(index, { body: e.target.value })}
              />
              {panel.kind === 'text' ? null : (
                <div className="space-y-1.5">
                  <select
                    aria-label={panel.kind === 'video' ? 'Video' : 'Image'}
                    className={inputClass}
                    value={panel.mediaUrl ?? ''}
                    onChange={(e) => patch(index, { mediaUrl: e.target.value || null })}
                  >
                    <option value="">Choose {panel.kind === 'video' ? 'a video' : 'an image'}…</option>
                    {media
                      .filter((m) => (panel.kind === 'video' ? m.kind === 'VIDEO' : m.kind !== 'VIDEO'))
                      .map((m, i) => (
                        <option key={m.id} value={m.url}>
                          {m.altText || `${panel.kind === 'video' ? 'Video' : 'Photo'} ${i + 1}`}
                        </option>
                      ))}
                  </select>
                  <UploadButton
                    storeId={storeId}
                    label={panel.kind === 'video' ? 'Upload video' : 'Upload image'}
                    onUploaded={(uploaded) => {
                      if (uploaded[0]) patch(index, { mediaUrl: uploaded[0].url })
                      onMediaChanged()
                    }}
                  />
                </div>
              )}
              <Field label="Link to an item (optional)">
                {(id) => (
                  <select id={id} className={inputClass} value={panel.itemId ?? ''} onChange={(e) => patch(index, { itemId: e.target.value || null })}>
                    <option value="">No item</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </div>
          </OrderedRow>
        ))}
      </ol>
      {panels.length < STOREFRONT_LIMITS.announcements ? (
        <Button
          type="button"
          variant="outline"
          size="small"
          onClick={() => setPanels([...panels, { id: newId(), kind: 'text', title: '', body: '', mediaUrl: null, itemId: null }])}
        >
          <Plus className="h-4 w-4" />
          Add announcement
        </Button>
      ) : null}
      {panels.some((panel) => !panel.title && !panel.body && !panel.mediaUrl) ? (
        <p className="text-xs text-muted-foreground">Empty panels aren’t shown or saved.</p>
      ) : null}
    </PanelSection>
  )
}
