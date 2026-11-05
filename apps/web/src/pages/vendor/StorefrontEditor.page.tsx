/**
 * StorefrontEditorPage - the vendor customizes their storefront while looking at it.
 *
 * Changes go to a draft (saved automatically) and show at once in a preview drawn by the same renderer
 * shoppers get, at phone or desktop width. Nothing reaches shoppers until Publish; Discard returns the
 * draft to what is live.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ExternalLink, Monitor, Smartphone } from 'lucide-react'
import {
  defaultStorefrontConfig,
  normalizeStorefrontConfig,
  sameStorefrontConfig,
  type StorefrontConfig,
} from '@packages/shared/storefront'
import { VendorPage } from '@layouts/VendorLayout/page'
import { Badge, Button } from '@shared/ui/primitives'
import { cn } from '@shared/lib/cn'
import { useStore } from '@shared/hooks/hooks/useStores'
import { useStoreItems } from '@shared/hooks/hooks/vendor/useStoreItems'
import { useMenuSections } from '@shared/hooks/hooks/useMenuSections'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { Storefront, type StorefrontPartKey } from '@features/storefront/Storefront'
import { storefrontQueryKey, useStorefront, useStorefrontEditor } from '@features/storefront/api'
import { BrandPanel } from './components/storefront-editor/BrandPanel'
import { MosaicPanel } from './components/storefront-editor/MosaicPanel'
import { FeaturedPanel } from './components/storefront-editor/FeaturedPanel'
import { LayoutPanel } from './components/storefront-editor/LayoutPanel'
import { AnnouncementsPanel } from './components/storefront-editor/AnnouncementsPanel'
import { BusinessPanel } from './components/storefront-editor/BusinessPanel'
import type { PanelProps } from './components/storefront-editor/types'
import type { StoreHeaderStore } from '@features/stores/components/StoreHeader/storeHeaderTypes'
import type { StorefrontHours } from '@features/storefront/api'
import type { MenuSection } from '@shared/lib/menu/menuSections'

const AUTOSAVE_MS = 700
const DEVICE_WIDTH = { mobile: 390, desktop: 1200 } as const
type Device = keyof typeof DEVICE_WIDTH

const TABS = [
  ['brand', 'Brand'],
  ['mosaic', 'Mosaic'],
  ['featured', 'Featured'],
  ['layout', 'Layout'],
  ['announcements', 'Announcements'],
  ['business', 'Business'],
] as const
type Tab = (typeof TABS)[number][0]

/** Which settings tab changes each part of the storefront. */
const PART_TAB: Record<StorefrontPartKey, Tab> = {
  header: 'brand',
  ordering: 'business',
  mosaic: 'mosaic',
  announcements: 'announcements',
  bundles: 'featured',
  featured: 'featured',
  categories: 'layout',
  menu: 'layout',
  about: 'business',
  gallery: 'layout',
  updates: 'layout',
}
/** The parts each tab affects, the first being where the preview scrolls to. */
const TAB_PARTS = Object.fromEntries(
  TABS.map(([tab]) => [tab, (Object.keys(PART_TAB) as StorefrontPartKey[]).filter((key) => PART_TAB[key] === tab)]),
) as Record<Tab, StorefrontPartKey[]>

type SaveState = 'saved' | 'pending' | 'saving' | 'error'

export default function StorefrontEditorPage() {
  const { storeId = '' } = useParams<{ storeId: string }>()
  const queryClient = useQueryClient()
  const { state, saveDraft, publish, discard } = useStorefrontEditor(storeId)
  const { data: preview, refetch: refetchPreview } = useStorefront(storeId, { view: 'draft' })
  const { data: store } = useStore(storeId)
  const { data: rawItems = [] } = useStoreItems(storeId)
  const { data: sections = [] } = useMenuSections(storeId, { view: 'team' })
  const bundles = useMemo(() => preview?.bundles ?? [], [preview?.bundles])
  const items = useMemo(() => rawItems.filter((item) => item.isActive !== false), [rawItems])

  const [tab, setTab] = useState<Tab>('brand')
  const [device, setDevice] = useState<Device>('desktop')
  // The part of the preview the open settings change; outlined briefly so the effect is visible.
  const [focusPart, setFocusPart] = useState<StorefrontPartKey | null>(null)
  useEffect(() => {
    if (!focusPart) return
    const clear = setTimeout(() => setFocusPart(null), 1800)
    return () => clearTimeout(clear)
  }, [focusPart])
  const { draft, update, save, reset, saveState } = useDraftAutosave(state.data?.draft, saveDraft.mutateAsync)

  const normalized = useMemo(() => (draft ? normalizeStorefrontConfig(draft) : null), [draft])
  const published = state.data?.published ?? null
  const hasChanges = normalized ? !sameStorefrontConfig(normalized, published ?? defaultStorefrontConfig()) : false

  const onPublish = async () => {
    try {
      if (saveState !== 'saved') await save()
      await publish.mutateAsync()
      toast.success('Your storefront is live')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The storefront could not be published')
    }
  }

  const onDiscard = async () => {
    if (!confirm('Discard your unpublished changes? Your storefront goes back to what shoppers see now.')) return
    try {
      const restored = await discard.mutateAsync()
      reset(restored.draft)
      toast.success('Changes discarded')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Your changes could not be discarded')
    }
  }

  const onMediaChanged = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: storefrontQueryKey(storeId, 'draft') })
    void refetchPreview()
  }, [queryClient, storeId, refetchPreview])

  const loading = state.isLoading || !preview || !store || !draft || !normalized
  const panelProps: PanelProps | null = draft
    ? { storeId, draft, update, items, media: preview?.media ?? [], bundles, onMediaChanged }
    : null

  return (
    <VendorPage
      title="Storefront"
      description="Design how shoppers see your store. Changes stay in a draft until you publish."
      width="full"
      loading={loading}
      error={state.error ? { message: state.error.message, onRetry: () => void state.refetch() } : undefined}
      actions={
        <>
          <SaveStatus state={saveState} hasChanges={hasChanges} publishedAt={state.data?.publishedAt ?? null} />
          {store ? (
            <Link
              to={getStoreRoute({ id: store.id, name: store.name })}
              target="_blank"
              className="inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-medium hover:bg-accent"
            >
              View live
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </Link>
          ) : null}
          <Button variant="outline" onClick={() => void onDiscard()} disabled={!hasChanges || discard.isPending}>
            Discard
          </Button>
          <Button variant="primary" onClick={() => void onPublish()} disabled={!hasChanges || publish.isPending} isLoading={publish.isPending}>
            Publish
          </Button>
        </>
      }
    >
      {loading || !panelProps ? null : (
        <div className="grid gap-5 lg:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[21rem_minmax(0,1fr)]">
          <SettingsColumn
            tab={tab}
            onTab={(next) => {
              setTab(next)
              setFocusPart(TAB_PARTS[next][0])
            }}
            panelProps={panelProps}
            store={store}
            hours={preview.hours}
            sections={sections}
          />

          <section aria-label="Preview" className="min-w-0 space-y-2">
            <PreviewToolbar device={device} onDevice={setDevice} />
            <PreviewFrame device={device} focusPart={focusPart}>
              {(scrollRoot) => (
                <Storefront
                  store={store}
                  data={preview}
                  config={normalized}
                  items={items}
                  sections={sections}
                  bundles={bundles}
                  mode="preview"
                  stickyTop={0}
                  scrollRoot={scrollRoot}
                  onEditSection={(key) => {
                    setTab(PART_TAB[key])
                    setFocusPart(key)
                  }}
                  highlight={focusPart}
                />
              )}
            </PreviewFrame>
          </section>
        </div>
      )}
    </VendorPage>
  )
}

function SettingsColumn({ tab, onTab, panelProps, store, hours, sections }: {
  readonly tab: Tab
  readonly onTab: (tab: Tab) => void
  readonly panelProps: PanelProps
  readonly store: StoreHeaderStore
  readonly hours: StorefrontHours | null
  readonly sections: readonly MenuSection[]
}) {
  return (
    <aside className="space-y-4" aria-label="Storefront settings">
      <div role="tablist" aria-label="Storefront settings" className="flex flex-wrap gap-1 border-b border-border pb-2">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => onTab(id)}
            className={cn(
              'rounded-md px-2.5 py-1.5 text-sm',
              tab === id ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label={TABS.find(([id]) => id === tab)?.[1]} className="lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto lg:pr-1 lg:[scrollbar-width:thin]">
        {tab === 'brand' ? (
          <BrandPanel {...panelProps} storeName={store.name} logoUrl={(store as { imageUrl?: string | null }).imageUrl ?? null} />
        ) : null}
        {tab === 'mosaic' ? <MosaicPanel {...panelProps} /> : null}
        {tab === 'featured' ? <FeaturedPanel {...panelProps} /> : null}
        {tab === 'layout' ? <LayoutPanel {...panelProps} /> : null}
        {tab === 'announcements' ? <AnnouncementsPanel {...panelProps} /> : null}
        {tab === 'business' ? <BusinessPanel storeId={panelProps.storeId} store={store} hours={hours} sections={sections} /> : null}
      </div>
    </aside>
  )
}

function PreviewToolbar({ device, onDevice }: { readonly device: Device; readonly onDevice: (device: Device) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">Preview · not yet live</p>
      <div role="radiogroup" aria-label="Preview size" className="flex rounded-lg bg-muted p-1">
        {(
          [
            ['desktop', 'Desktop', Monitor],
            ['mobile', 'Phone', Smartphone],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={device === id}
            onClick={() => onDevice(id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium',
              device === id ? 'bg-background shadow-sm' : 'text-muted-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * The editor's working copy of the draft. It leads: changes show at once and reach the server after a
 * short pause. The server's normalized copy is not written back, so a half-typed color isn't undone.
 */
function useDraftAutosave(
  initial: StorefrontConfig | undefined,
  persist: (config: StorefrontConfig) => Promise<unknown>,
) {
  const [draft, setDraft] = useState<StorefrontConfig | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const draftRef = useRef<StorefrontConfig | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (draft === null && initial) {
      setDraft(initial)
      draftRef.current = initial
    }
  }, [draft, initial])

  const save = useCallback(async () => {
    clearTimeout(timer.current)
    const current = draftRef.current
    if (!current) return
    setSaveState('saving')
    try {
      await persist(normalizeStorefrontConfig(current))
      // Another change may have come in while saving; it has its own timer.
      setSaveState((s) => (s === 'saving' ? 'saved' : s))
    } catch (error) {
      setSaveState('error')
      throw error
    }
  }, [persist])

  const saveLater = useCallback(async () => {
    try {
      await save()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Your changes could not be saved')
    }
  }, [save])

  const update = useCallback(
    (change: (draft: StorefrontConfig) => StorefrontConfig) => {
      const next = change(draftRef.current ?? defaultStorefrontConfig())
      draftRef.current = next
      setDraft(next)
      setSaveState('pending')
      clearTimeout(timer.current)
      timer.current = setTimeout(() => void saveLater(), AUTOSAVE_MS)
    },
    [saveLater],
  )

  const reset = useCallback((config: StorefrontConfig) => {
    clearTimeout(timer.current)
    draftRef.current = config
    setDraft(config)
    setSaveState('saved')
  }, [])

  // Don't lose a change that hasn't reached the server yet.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (saveState === 'pending' || saveState === 'saving') e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [saveState])
  useEffect(() => () => clearTimeout(timer.current), [])

  return { draft, update, save, reset, saveState }
}

function SaveStatus({ state, hasChanges, publishedAt }: { readonly state: SaveState; readonly hasChanges: boolean; readonly publishedAt: string | null }) {
  let label = publishedAt ? 'Live' : 'Not published yet'
  let variant: 'destructive' | 'warning' | 'secondary' = 'secondary'
  if (hasChanges) {
    label = 'Unpublished changes'
    variant = 'warning'
  }
  if (state === 'pending' || state === 'saving') label = 'Saving…'
  if (state === 'error') {
    label = 'Not saved'
    variant = 'destructive'
  }
  return (
    <span role="status" aria-live="polite" className="self-center">
      <Badge variant={variant}>{label}</Badge>
    </span>
  )
}

/**
 * Draws the storefront at a real device width, scaled to fit, inside its own scrolling area. Using
 * `zoom` (not `transform`) keeps layout, sticky bars and container queries working at the true width.
 */
function PreviewFrame({ device, focusPart, children }: {
  readonly device: Device
  readonly focusPart: StorefrontPartKey | null
  readonly children: (scrollRoot: HTMLElement | null) => React.ReactNode
}) {
  const [frame, setFrame] = useState<HTMLDivElement | null>(null)

  // Bring the part being edited into view.
  useEffect(() => {
    if (!frame || !focusPart) return
    const target = frame.querySelector<HTMLElement>(`[data-storefront-section="${focusPart}"]`)
    if (!target) return
    const top = target.getBoundingClientRect().top - frame.getBoundingClientRect().top + frame.scrollTop - 16
    frame.scrollTo?.({ top: Math.max(0, top), behavior: 'smooth' })
  }, [frame, focusPart])
  const [available, setAvailable] = useState(0)
  const width = DEVICE_WIDTH[device]

  useEffect(() => {
    if (!frame) return
    const measure = () => setAvailable(frame.parentElement?.clientWidth ?? frame.clientWidth)
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(frame.parentElement ?? frame)
    return () => observer?.disconnect()
  }, [frame])

  const scale = available > 0 ? Math.min(1, available / width) : 1
  return (
    <div
      ref={setFrame}
      className={cn(
        'mx-auto h-[calc(100vh-11rem)] min-h-[34rem] overflow-y-auto overflow-x-hidden rounded-xl border border-border bg-background shadow-sm',
        device === 'mobile' && 'rounded-[2rem] border-[6px] border-foreground/80',
      )}
      style={{ width: Math.round(width * scale) + (device === 'mobile' ? 12 : 2) }}
    >
      <div style={{ width, zoom: scale }}>{children(frame)}</div>
    </div>
  )
}
