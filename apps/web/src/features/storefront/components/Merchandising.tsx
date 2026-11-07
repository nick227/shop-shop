/**
 * Merchandising rows above the menu: bundles, featured products, announcements and category tiles.
 */
import { resolveBrowserAssetUrl } from '@shared/lib/utils/resolveBrowserAssetUrl'
import type { ReactNode } from 'react'
import { Megaphone, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { ItemResponse } from '@api/types'
import type { StorefrontAnnouncement } from '@packages/shared/storefront'
import type { BundleCardProps } from '@features/products/components/BundleCard/BundleCard'
import { useAddBundleToCart } from '@shared/hooks/hooks/useAddBundleToCart'
import { formatCurrency } from '@shared/lib/utils/format'
import type { MenuGroup } from '@shared/lib/menu/menuSections'
import { ProductTile, itemImage } from './ProductTile'
import { useStorefrontActions } from '../context'

export type StorefrontBundle = BundleCardProps['bundle']

export function RowSection({ title, children, id }: { readonly title: string; readonly children: ReactNode; readonly id: string }) {
  return (
    <section aria-labelledby={id} className="space-y-2.5">
      <h2 id={id} className="sf-heading text-lg font-bold text-foreground">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function BundlesRow({ bundles }: { readonly bundles: readonly StorefrontBundle[] }) {
  if (bundles.length === 0) return null
  return (
    <RowSection title="Bundles" id="sf-bundles">
      <div className="sf-row">
        {bundles.map((bundle) => (
          <BundleTile key={bundle.id} bundle={bundle} />
        ))}
      </div>
    </RowSection>
  )
}

/** A bundle as a compact card: what's in it, its price and savings, and one tap to add it. */
function BundleTile({ bundle }: { readonly bundle: StorefrontBundle }) {
  const { store, mode } = useStorefrontActions()
  const addBundle = useAddBundleToCart()
  const contents = bundle.items ?? []
  const savings = bundle.savings ?? (bundle.itemSum ? bundle.itemSum - bundle.resolvedPrice : 0)
  const available = bundle.isActive !== false && contents.length > 0

  const add = () => {
    if (mode === 'preview') {
      toast.info('Shoppers add bundles to their cart here.')
      return
    }
    addBundle.mutate({ storeId: store.id, bundleId: bundle.id, title: bundle.name, unitPrice: bundle.resolvedPrice, bundleItems: contents })
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      {bundle.imageUrl ? <img src={resolveBrowserAssetUrl(bundle.imageUrl)} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" /> : null}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-snug text-foreground">{bundle.name}</h3>
          {savings > 0.005 && bundle.pricing?.showSavings !== false ? (
            <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: 'var(--sf-accent)', color: 'var(--sf-on-accent)' }}>
              {bundle.pricing?.savingsLabel ?? `Save ${formatCurrency(savings)}`}
            </span>
          ) : null}
        </div>
        {bundle.description ? <p className="text-sm text-muted-foreground line-clamp-2">{bundle.description}</p> : null}
        {contents.length > 0 ? (
          <ul className="space-y-0.5 text-sm text-muted-foreground">
            {contents.slice(0, 4).map((line) => (
              <li key={line.itemId} className="truncate">
                {line.quantity > 1 ? `${line.quantity} × ` : ''}
                {line.title}
              </li>
            ))}
            {contents.length > 4 ? <li>+ {contents.length - 4} more</li> : null}
          </ul>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="font-semibold text-foreground">{formatCurrency(bundle.resolvedPrice)}</span>
          <button
            type="button"
            onClick={add}
            disabled={!available || addBundle.isPending}
            aria-label={`Add ${bundle.name} to cart`}
            className="inline-flex h-9 items-center gap-1 rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add
          </button>
        </div>
      </div>
    </article>
  )
}

export function FeaturedRow({ items }: { readonly items: readonly ItemResponse[] }) {
  if (items.length === 0) return null
  return (
    <RowSection title="Featured" id="sf-featured">
      <div className="sf-row sf-row-featured">
        {items.map((item) => (
          <ProductTile key={item.id} item={item} variant="card" />
        ))}
      </div>
    </RowSection>
  )
}

export function Announcements({ panels, itemsById }: {
  readonly panels: readonly StorefrontAnnouncement[]
  readonly itemsById: ReadonlyMap<string, ItemResponse>
}) {
  const { openItem } = useStorefrontActions()
  if (panels.length === 0) return null
  return (
    <section aria-label="Announcements" className={panels.length > 1 ? 'sf-row' : ''}>
      {panels.map((panel) => {
        const item = panel.itemId ? itemsById.get(panel.itemId) : undefined
        return (
          <article
            key={panel.id}
            className="flex min-h-[9rem] flex-col overflow-hidden rounded-2xl"
            style={{ background: 'var(--sf-accent)', color: 'var(--sf-on-accent)' }}
          >
            {panel.kind === 'image' && panel.mediaUrl ? (
              <img src={resolveBrowserAssetUrl(panel.mediaUrl)} alt="" className="aspect-[16/7] w-full object-cover" />
            ) : null}
            {panel.kind === 'video' && panel.mediaUrl ? (
              <video src={resolveBrowserAssetUrl(panel.mediaUrl)} className="aspect-[16/7] w-full object-cover" muted loop playsInline autoPlay controls>
                <track kind="captions" />
              </video>
            ) : null}
            <div className="flex flex-1 flex-col gap-1.5 p-4">
              {panel.kind === 'text' ? <Megaphone className="h-5 w-5 opacity-80" aria-hidden /> : null}
              {panel.title ? <h2 className="sf-heading text-lg font-bold leading-snug">{panel.title}</h2> : null}
              {panel.body ? <p className="whitespace-pre-line text-sm opacity-90">{panel.body}</p> : null}
              {item ? (
                <button
                  type="button"
                  onClick={() => openItem(item)}
                  className="mt-auto self-start rounded-full bg-black/15 px-4 py-1.5 text-sm font-semibold hover:bg-black/25"
                >
                  See {item.title}
                </button>
              ) : null}
            </div>
          </article>
        )
      })}
    </section>
  )
}

/** A directory of the store's sections for big catalogs: name, size, and a photo when one exists. */
export function CategoryTiles({ groups, onJump }: {
  readonly groups: readonly MenuGroup<ItemResponse>[]
  readonly onJump: (groupId: string) => void
}) {
  if (groups.length < 2) return null
  return (
    <RowSection title="Shop by section" id="sf-category-tiles">
      <ul className="sf-category-tiles">
        {groups.map((group) => {
          const pictured = group.items.map(itemImage).find(Boolean)
          return (
            <li key={group.id}>
              <button
                type="button"
                onClick={() => onJump(group.id)}
                className="flex h-16 w-full items-center gap-3 rounded-xl border border-border bg-card p-2 pr-3 text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {pictured ? <img src={resolveBrowserAssetUrl(pictured)} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : null}
                <span className={pictured ? 'min-w-0' : 'min-w-0 pl-2'}>
                  <span className="block truncate text-sm font-semibold leading-tight">{group.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </RowSection>
  )
}
