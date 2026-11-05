/** The pieces around the map: the drawing bar, the area being edited, and the list of areas. */
import { Button, Checkbox, Input } from '@shared/ui/primitives'
import { FormRow } from '@shared/ui/templates'
import { amount, money, onEnter, zoneTerms, type Draft } from './deliveryCopy'
import { ringSquareMiles, type LatLng, type ZoneDto } from './zoneGeometry'

export function DrawingBar({ draft, square, onChange }: {
  readonly draft: Draft
  /** A starting outline around the store, when it has a location. */
  readonly square: LatLng[] | null
  readonly onChange: (draft: Draft) => void
}) {
  const corners = draft.ring.length
  const status = corners === 0 ? 'Click the map to place the first corner.' : `${corners} corner${corners === 1 ? '' : 's'}. Keep clicking around the area.`
  return (
    <div className="absolute inset-x-2 top-2 z-[500] flex flex-wrap items-center gap-2 rounded-md bg-background/95 px-3 py-2 text-sm shadow">
      <span className="mr-auto" aria-live="polite">
        {status}
      </span>
      {corners === 0 && square ? (
        <Button type="button" size="small" variant="ghost" onClick={() => onChange({ ...draft, ring: square, drawing: false })}>
          Start with a square
        </Button>
      ) : null}
      <Button type="button" size="small" variant="outline" disabled={corners === 0} onClick={() => onChange({ ...draft, ring: draft.ring.slice(0, -1) })}>
        Undo
      </Button>
      <Button type="button" size="small" disabled={corners < 3} onClick={() => onChange({ ...draft, drawing: false, error: undefined })}>
        Finish outline
      </Button>
    </div>
  )
}

export function DraftPanel({ draft, storeMinimum, saving, onChange, onSave, onCancel }: {
  readonly draft: Draft
  readonly storeMinimum: number | null
  readonly saving: boolean
  readonly onChange: (draft: Draft) => void
  readonly onSave: () => void
  readonly onCancel: () => void
}) {
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch, error: undefined })
  const enter = onEnter(onSave)
  const shaped = !draft.drawing && draft.ring.length >= 3
  return (
    <div className="space-y-3 rounded-md border border-border p-4" role="group" aria-label={draft.id ? `Edit ${draft.name}` : 'New delivery area'}>
      <p className="text-sm font-medium">{draft.id ? 'Edit area' : 'New delivery area'}</p>
      {shaped ? (
        <p className="text-xs text-muted-foreground">
          About {ringSquareMiles(draft.ring).toFixed(1)} sq mi. Drag a corner to move it, click a dot on an edge to add one, double-click a corner to remove it.
        </p>
      ) : null}
      <FormRow>
        <Input label="Area name" value={draft.name} maxLength={60} onKeyDown={enter} onChange={(e) => set({ name: e.target.value })} />
        <Input
          label="Delivery fee ($)"
          type="number"
          min="0"
          step="0.01"
          value={draft.fee}
          placeholder="0 for free"
          onKeyDown={enter}
          onChange={(e) => set({ fee: e.target.value })}
        />
        <Input
          label="Minimum order ($)"
          type="number"
          min="0"
          step="0.01"
          value={draft.minimum}
          placeholder={storeMinimum ? `Store default ${money(storeMinimum)}` : 'No minimum'}
          onKeyDown={enter}
          onChange={(e) => set({ minimum: e.target.value })}
        />
      </FormRow>
      {draft.error ? (
        <p role="alert" className="text-sm text-destructive">
          {draft.error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onSave} disabled={saving || draft.drawing}>
          {saving ? 'Saving…' : 'Save area'}
        </Button>
        {draft.id && shaped ? (
          <Button type="button" variant="outline" onClick={() => set({ ring: [], drawing: true })}>
            Redraw
          </Button>
        ) : null}
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

export function ZoneList({ zones, colorOf, storeMinimum, busy, editing, onToggle, onEdit, onDelete }: {
  readonly zones: readonly ZoneDto[]
  readonly colorOf: (zone: ZoneDto) => string
  readonly storeMinimum: number | null
  readonly busy: boolean
  readonly editing: boolean
  readonly onToggle: (zone: ZoneDto) => void
  readonly onEdit: (zone: ZoneDto) => void
  readonly onDelete: (zone: ZoneDto) => void
}) {
  if (zones.length === 0) return null
  return (
    <ul aria-label="Delivery areas" className="divide-y divide-border rounded-md border border-border">
      {zones.map((zone) => (
        <li key={zone.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
          <span aria-hidden className="h-3 w-3 shrink-0 rounded-sm" style={{ background: colorOf(zone), opacity: zone.isActive ? 1 : 0.35 }} />
          <div className="min-w-0 flex-1">
            <p className={`truncate text-sm font-medium ${zone.isActive ? '' : 'text-muted-foreground'}`}>{zone.name}</p>
            <p className="text-xs text-muted-foreground">
              {zone.isActive ? zoneTerms(Number(zone.baseFee), amount(zone.minOrder), storeMinimum) : 'Off: no delivery here'}
            </p>
          </div>
          <div className="flex w-full items-center gap-2 pl-6 sm:w-auto sm:pl-0">
            <Checkbox id={`zone-active-${zone.id}`} label="Delivers" checked={zone.isActive} disabled={busy} onChange={() => onToggle(zone)} />
            <span className="flex-1 sm:hidden" />
            <Button type="button" size="small" variant="outline" disabled={editing} onClick={() => onEdit(zone)} aria-label={`Edit ${zone.name}`}>
              Edit
            </Button>
            <Button type="button" size="small" variant="ghost" onClick={() => onDelete(zone)} aria-label={`Delete ${zone.name}`}>
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
