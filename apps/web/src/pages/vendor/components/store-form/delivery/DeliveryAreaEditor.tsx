/**
 * Where the store delivers, and for how much — on one map. A store delivers either within a distance
 * of its address, or inside areas the vendor draws (each with its own fee and minimum). The address
 * check answers with the same rules checkout uses, so what the vendor sees is what shoppers get.
 */
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Input, Button, useConfirm } from '@shared/ui/primitives'
import { FormRow } from '@shared/ui/templates'
import type { StoreFieldProps } from '../storeFieldProps'
import { hasCoordinate } from '../storeFieldProps'
import { AddressCheck } from './AddressCheck'
import { amount, areaSummary, draftProblem, zoneTerms, type Draft } from './deliveryCopy'
import { DraftPanel, DrawingBar, ZoneList } from './ZonePanels'
import { ZONE_COLORS, squareAround, toGeoJson, zoneRing, type LatLng, type ZoneDto } from './zoneGeometry'
import { useDeleteZone, useDeliveryZones, useSaveZone, type DeliveryPreview } from './useDeliveryZones'

const DeliveryAreaMap = lazy(() => import('./DeliveryAreaMap'))

type Confirm = ReturnType<typeof useConfirm>['confirm']

/** Saving, switching and deleting areas, each with feedback the vendor can see. */
function useZoneActions(storeId: string, zones: readonly ZoneDto[], radius: number | null, confirm: Confirm) {
  const saveZone = useSaveZone(storeId)
  const deleteZone = useDeleteZone(storeId)
  const activeZones = zones.filter((zone) => zone.isActive)
  const fallback = radius ? `within ${radius} miles get delivery instead` : 'see pickup only until you set a delivery area'

  const save = async (draft: Draft): Promise<string | null> => {
    const problem = draftProblem(draft)
    if (problem) return problem
    const name = draft.name.trim()
    try {
      await saveZone.mutateAsync({
        id: draft.id,
        input: {
          name,
          polygonJson: toGeoJson(draft.ring),
          baseFee: Number(draft.fee),
          minOrder: draft.minimum === '' ? null : Number(draft.minimum),
          // Earlier areas win where areas overlap, matching the list order.
          ...(draft.id ? {} : { priority: -zones.length, isActive: true }),
        },
      })
      toast.success(draft.id ? `${name} updated` : `${name} saved. Shoppers there can choose delivery.`)
      return null
    } catch (error) {
      return (error as Error).message
    }
  }

  const toggle = async (zone: ZoneDto) => {
    try {
      await saveZone.mutateAsync({ id: zone.id, input: { isActive: !zone.isActive } })
      toast.success(zone.isActive ? `${zone.name} no longer gets delivery` : `${zone.name} gets delivery again`)
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  const remove = async (zone: ZoneDto): Promise<boolean> => {
    const lastOne = activeZones.length === 1 && zone.isActive
    const ok = await confirm({
      title: `Delete ${zone.name}?`,
      description: lastOne ? `This is your only delivery area. Without it, shoppers ${fallback}.` : 'Shoppers in this area will no longer see delivery from it.',
      confirmLabel: 'Delete area',
      variant: 'danger',
    })
    if (!ok) return false
    try {
      await deleteZone.mutateAsync(zone.id)
      toast.success(`${zone.name} deleted`)
      return true
    } catch (error) {
      toast.error((error as Error).message)
      return false
    }
  }

  /** Back to a radius: areas are turned off, not deleted. */
  const switchToRadius = async (): Promise<boolean> => {
    if (activeZones.length === 0) return true
    const which = activeZones.length === 1 ? 'area is' : `${activeZones.length} areas are`
    const ok = await confirm({
      title: 'Deliver by distance instead?',
      description: `Your ${which} turned off (not deleted), and shoppers ${radius ? `within ${radius} miles` : 'within the distance you set'} get delivery.`,
      confirmLabel: 'Use distance',
    })
    if (!ok) return false
    try {
      await Promise.all(activeZones.map((zone) => saveZone.mutateAsync({ id: zone.id, input: { isActive: false } })))
      toast.success('Delivery now uses distance from your store')
      return true
    } catch (error) {
      toast.error((error as Error).message)
      return false
    }
  }

  return { save, toggle, remove, switchToRadius, saving: saveZone.isPending }
}

function AreaMethod({ usingZones, canDraw, onDistance, onZones }: {
  readonly usingZones: boolean
  readonly canDraw: boolean
  readonly onDistance: () => void
  readonly onZones: () => void
}) {
  const options = [
    { id: 'distance', label: 'Distance from store', hint: 'One radius, one fee', checked: !usingZones, disabled: false, pick: onDistance },
    { id: 'zones', label: 'Areas you draw', hint: canDraw ? 'Fees and minimums by area' : 'Save the store first', checked: usingZones, disabled: !canDraw, pick: onZones },
  ]
  return (
    <div role="radiogroup" aria-label="Delivery area" className="grid grid-cols-2 gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={option.checked}
          disabled={option.disabled}
          onClick={option.checked ? undefined : option.pick}
          className={`rounded-md border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
            option.checked ? 'border-foreground bg-accent/40' : 'border-border hover:bg-accent/30'
          }`}
        >
          <span className="block text-sm font-medium">{option.label}</span>
          <span className="block text-xs text-muted-foreground">{option.hint}</span>
        </button>
      ))}
    </div>
  )
}

function RadiusFields({ formData, onChange }: StoreFieldProps) {
  return (
    <FormRow>
      <Input
        label="Delivers within (miles)"
        type="number"
        value={formData.deliveryDistance}
        onChange={(e) => onChange('deliveryDistance', e.target.value)}
        min="0"
        step="0.1"
        placeholder="5"
      />
      <Input
        label="Delivery fee ($)"
        type="number"
        value={formData.deliveryCharge}
        onChange={(e) => onChange('deliveryCharge', e.target.value)}
        min="0"
        step="0.01"
        placeholder="0 for free"
      />
      <Input
        label="Minimum order ($)"
        type="number"
        value={formData.deliveryMinimum ?? ''}
        onChange={(e) => onChange('deliveryMinimum', e.target.value)}
        min="0"
        step="0.01"
        placeholder="No minimum"
      />
    </FormRow>
  )
}

function AreasSection({ zones, colorOf, formData, onChange, busy, editing, onToggle, onEdit, onDelete, onDraw }: StoreFieldProps & {
  readonly zones: readonly ZoneDto[]
  readonly colorOf: (zone: ZoneDto) => string
  readonly busy: boolean
  readonly editing: boolean
  readonly onToggle: (zone: ZoneDto) => void
  readonly onEdit: (zone: ZoneDto) => void
  readonly onDelete: (zone: ZoneDto) => void
  readonly onDraw: () => void
}) {
  return (
    <div className="space-y-3">
      <ZoneList
        zones={zones}
        colorOf={colorOf}
        storeMinimum={amount(formData.deliveryMinimum)}
        busy={busy}
        editing={editing}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      {editing ? null : (
        <Button type="button" variant="outline" onClick={onDraw}>
          {zones.length === 0 ? 'Draw a delivery area' : 'Draw another area'}
        </Button>
      )}
      {zones.length > 1 ? <p className="text-xs text-muted-foreground">Where areas overlap, the one higher in this list applies.</p> : null}
      <Input
        label="Default minimum order ($)"
        type="number"
        value={formData.deliveryMinimum ?? ''}
        onChange={(e) => onChange('deliveryMinimum', e.target.value)}
        min="0"
        step="0.01"
        placeholder="No minimum"
        helperText="For areas without their own minimum. Saved with the store."
      />
    </div>
  )
}

/** The store's location and delivery terms as numbers (null where unset). */
function storeDelivery(formData: StoreFieldProps['formData']) {
  const located = hasCoordinate(formData.latitude) && hasCoordinate(formData.longitude)
  return {
    store: located ? ([Number(formData.latitude), Number(formData.longitude)] as LatLng) : null,
    radius: amount(formData.deliveryDistance),
    storeFee: amount(formData.deliveryCharge),
    storeMinimum: amount(formData.deliveryMinimum),
  }
}

/** The map with everything on it, and the drawing bar while an outline is being drawn. */
function AreaMapPanel({ store, radius, usingZones, zones, storeMinimum, draft, onDraftChange, onEdit, pin }: {
  readonly store: LatLng | null
  readonly radius: number | null
  readonly usingZones: boolean
  readonly zones: readonly ZoneDto[]
  readonly storeMinimum: number | null
  readonly draft: Draft | null
  readonly onDraftChange: (draft: Draft) => void
  readonly onEdit: (zone: ZoneDto) => void
  readonly pin: DeliveryPreview | null
}) {
  const colorAt = (index: number) => ZONE_COLORS[Math.max(0, index) % ZONE_COLORS.length]
  // Drawing happens on the map; bring it into view when it starts.
  const mapRef = useRef<HTMLDivElement>(null)
  const drawing = draft?.drawing ?? false
  useEffect(() => {
    if (drawing) mapRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
  }, [drawing])

  const mapZones = useMemo(
    () =>
      zones
        .filter((zone) => zone.id !== draft?.id)
        .map((zone) => ({
          id: zone.id,
          ring: zoneRing(zone),
          color: colorAt(zones.indexOf(zone)),
          label: `${zone.name}: ${zoneTerms(Number(zone.baseFee), amount(zone.minOrder), storeMinimum)}${zone.isActive ? '' : ' (off)'}`,
          active: zone.isActive,
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [zones, draft?.id, storeMinimum],
  )
  const draftIndex = draft?.id ? zones.findIndex((zone) => zone.id === draft.id) : zones.length
  const showMap = store !== null || zones.length > 0
  const square = store ? squareAround(store, Math.max(1, (radius ?? 2) * 1.4)) : null
  const pinned = pin?.destination ? { at: [pin.destination.lat, pin.destination.lng] as LatLng, ok: pin.eligibility.available } : null

  return (
    <div ref={mapRef} className="relative isolate h-72 overflow-hidden rounded-md border border-border sm:h-96" data-testid="delivery-map">
      {showMap ? (
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-muted" />}>
          <DeliveryAreaMap
            store={store}
            radiusMiles={usingZones ? null : radius}
            zones={usingZones ? mapZones : []}
            draft={draft ? { ring: draft.ring, color: colorAt(draftIndex), drawing: draft.drawing } : null}
            onDraftChange={(ring) => draft && onDraftChange({ ...draft, ring, error: undefined })}
            onSelectZone={(id) => {
              const zone = zones.find((z) => z.id === id)
              if (zone) onEdit(zone)
            }}
            pin={pinned}
          />
        </Suspense>
      ) : (
        <div className="flex h-full items-center justify-center bg-muted/40 p-6 text-center text-sm text-muted-foreground">
          Add your store’s address on the Location tab to see your delivery area on a map.
        </div>
      )}
      {draft?.drawing ? <DrawingBar draft={draft} square={square} onChange={onDraftChange} /> : null}
    </div>
  )
}

export function DeliveryAreaEditor({ storeId, formData, onChange }: StoreFieldProps & { readonly storeId?: string }) {
  const zones = useDeliveryZones(storeId).data ?? []
  const activeCount = zones.filter((zone) => zone.isActive).length
  const [wantZones, setWantZones] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [pin, setPin] = useState<DeliveryPreview | null>(null)
  const { confirm, dialog } = useConfirm()

  const { store, radius, storeFee, storeMinimum } = storeDelivery(formData)
  const usingZones = activeCount > 0 || wantZones || draft !== null
  const actions = useZoneActions(storeId ?? '', zones, radius, confirm)
  const colorOf = (zone: ZoneDto) => ZONE_COLORS[Math.max(0, zones.indexOf(zone)) % ZONE_COLORS.length]

  const startDrawing = () => {
    setWantZones(true)
    setPin(null)
    setDraft({ name: zones.length === 0 ? 'Delivery area' : `Area ${zones.length + 1}`, fee: storeFee === null ? '' : String(storeFee), minimum: '', ring: [], drawing: true })
  }
  const editZone = (zone: ZoneDto) => {
    setPin(null)
    const minimum = amount(zone.minOrder)
    setDraft({ id: zone.id, name: zone.name, fee: String(Number(zone.baseFee)), minimum: minimum === null ? '' : String(minimum), ring: zoneRing(zone), drawing: false })
  }
  const saveDraft = async () => {
    if (!draft || !storeId) return
    const error = await actions.save(draft)
    if (error) setDraft({ ...draft, drawing: draft.ring.length < 3 && draft.drawing, error })
    else setDraft(null)
  }
  const chooseRadius = async () => {
    if (!(await actions.switchToRadius())) return
    setDraft(null)
    setWantZones(false)
  }
  const deleteZone = async (zone: ZoneDto) => {
    if ((await actions.remove(zone)) && draft?.id === zone.id) setDraft(null)
  }
  const chooseZones = () => (zones.length > 0 ? setWantZones(true) : startDrawing())

  const summary = areaSummary({ usingZones, activeZones: activeCount, radius, fee: storeFee, minimum: storeMinimum })

  return (
    <div className="space-y-4">
      <AreaMethod usingZones={usingZones} canDraw={Boolean(storeId)} onDistance={() => void chooseRadius()} onZones={chooseZones} />

      <AreaMapPanel
        store={store}
        radius={radius}
        usingZones={usingZones}
        zones={zones}
        storeMinimum={storeMinimum}
        draft={draft}
        onDraftChange={setDraft}
        onEdit={editZone}
        pin={pin}
      />
      <p role={summary.warns ? 'alert' : undefined} className={`text-sm ${summary.warns ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}`}>
        {summary.text}
      </p>

      {draft ? (
        <DraftPanel
          draft={draft}
          storeMinimum={storeMinimum}
          saving={actions.saving}
          onChange={setDraft}
          onSave={() => void saveDraft()}
          onCancel={() => setDraft(null)}
        />
      ) : null}

      {usingZones ? (
        <AreasSection
          zones={zones}
          colorOf={colorOf}
          formData={formData}
          onChange={onChange}
          busy={actions.saving}
          editing={draft !== null}
          onToggle={(zone) => void actions.toggle(zone)}
          onEdit={editZone}
          onDelete={(zone) => void deleteZone(zone)}
          onDraw={startDrawing}
        />
      ) : (
        <RadiusFields formData={formData} onChange={onChange} />
      )}

      {storeId ? <AddressCheck storeId={storeId} city={formData.addressCity} state={formData.addressState} onResult={setPin} /> : null}
      {dialog}
    </div>
  )
}
