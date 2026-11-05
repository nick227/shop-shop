/**
 * Featured content: pinned products (in order), products never to feature, whether popular items fill
 * the rest; and the same for bundles.
 */
import { STOREFRONT_LIMITS } from '@packages/shared/storefront'
import { Field, OrderedRow, PanelSection, Toggle, inputClass, moveInList } from './controls'
import type { PanelProps } from './types'

const without = (list: readonly string[], id: string) => list.filter((other) => other !== id)

export function FeaturedPanel({ draft, update, items, bundles }: PanelProps) {
  const featured = draft.featured
  const setFeatured = (patch: Partial<typeof featured>) => update((d) => ({ ...d, featured: { ...d.featured, ...patch } }))
  const itemsById = new Map(items.map((item) => [item.id, item]))
  const bundlesById = new Map(bundles.map((bundle) => [bundle.id, bundle]))
  const pinned = new Set(featured.itemIds)
  const excluded = new Set(featured.excludedItemIds)
  const pinnedBundles = new Set(featured.bundleIds)
  const excludedBundles = new Set(featured.excludedBundleIds)

  return (
    <div className="space-y-5">
      <PanelSection title="Featured products" description="Pinned products come first, in this order.">
        {featured.itemIds.length > 0 ? (
          <ol className="space-y-2">
            {featured.itemIds.map((id, index) => {
              const title = itemsById.get(id)?.title ?? 'Unavailable item'
              return (
                <OrderedRow
                  key={id}
                  label={title}
                  index={index}
                  count={featured.itemIds.length}
                  onMove={(offset) => setFeatured({ itemIds: moveInList(featured.itemIds, index, offset) })}
                  onRemove={() => setFeatured({ itemIds: featured.itemIds.filter((other) => other !== id) })}
                >
                  <span className="truncate text-sm">{title}</span>
                </OrderedRow>
              )
            })}
          </ol>
        ) : null}
        {featured.itemIds.length < STOREFRONT_LIMITS.featuredItems ? (
          <select
            aria-label="Pin a product"
            className={inputClass}
            value=""
            onChange={(e) =>
              e.target.value &&
              setFeatured({
                itemIds: [...featured.itemIds, e.target.value],
                excludedItemIds: featured.excludedItemIds.filter((id) => id !== e.target.value),
              })
            }
          >
            <option value="">Pin a product…</option>
            {items
              .filter((item) => !pinned.has(item.id))
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
          </select>
        ) : null}
        <Toggle
          label="Fill with popular items"
          description="Your best sellers fill the remaining spots. New stores show pictured items until sales come in."
          checked={featured.autoFill}
          onChange={(autoFill) => setFeatured({ autoFill })}
        />
        {featured.autoFill ? (
          <Field label="Never feature">
            {(id) => (
              <div className="space-y-2">
                {featured.excludedItemIds.length > 0 ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {featured.excludedItemIds.map((itemId) => (
                      <li key={itemId}>
                        <button
                          type="button"
                          onClick={() => setFeatured({ excludedItemIds: without(featured.excludedItemIds, itemId) })}
                          className="rounded-full bg-muted px-2.5 py-1 text-xs hover:bg-muted/70"
                          aria-label={`Allow ${itemsById.get(itemId)?.title ?? 'item'} to be featured`}
                        >
                          {itemsById.get(itemId)?.title ?? 'Unavailable item'} ×
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <select
                  id={id}
                  className={inputClass}
                  value=""
                  onChange={(e) => e.target.value && setFeatured({ excludedItemIds: [...featured.excludedItemIds, e.target.value] })}
                >
                  <option value="">Choose a product to leave out…</option>
                  {items
                    .filter((item) => !pinned.has(item.id) && !excluded.has(item.id))
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </Field>
        ) : null}
      </PanelSection>

      <PanelSection
        title="Bundles"
        description={bundles.length === 0 ? 'No active bundles yet. Create them under Menu → Bundles.' : 'Pinned bundles lead; the rest follow unless hidden.'}
      >
        {featured.bundleIds.length > 0 ? (
          <ol className="space-y-2">
            {featured.bundleIds.map((id, index) => {
              const name = bundlesById.get(id)?.name ?? 'Unavailable bundle'
              return (
                <OrderedRow
                  key={id}
                  label={name}
                  index={index}
                  count={featured.bundleIds.length}
                  onMove={(offset) => setFeatured({ bundleIds: moveInList(featured.bundleIds, index, offset) })}
                  onRemove={() => setFeatured({ bundleIds: featured.bundleIds.filter((other) => other !== id) })}
                >
                  <span className="truncate text-sm">{name}</span>
                </OrderedRow>
              )
            })}
          </ol>
        ) : null}
        {bundles.length > 0 ? (
          <ul className="space-y-1.5">
            {bundles
              .filter((bundle) => !pinnedBundles.has(bundle.id))
              .map((bundle) => (
                <li key={bundle.id} className="flex items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{bundle.name}</span>
                  <button
                    type="button"
                    className="text-xs font-medium text-primary hover:underline"
                    onClick={() =>
                      setFeatured({
                        bundleIds: [...featured.bundleIds, bundle.id],
                        excludedBundleIds: featured.excludedBundleIds.filter((id) => id !== bundle.id),
                      })
                    }
                  >
                    Pin
                  </button>
                  <button
                    type="button"
                    className="text-xs font-medium text-muted-foreground hover:underline"
                    aria-pressed={excludedBundles.has(bundle.id)}
                    onClick={() =>
                      setFeatured({
                        excludedBundleIds: excludedBundles.has(bundle.id)
                          ? featured.excludedBundleIds.filter((id) => id !== bundle.id)
                          : [...featured.excludedBundleIds, bundle.id],
                      })
                    }
                  >
                    {excludedBundles.has(bundle.id) ? 'Hidden · show' : 'Hide'}
                  </button>
                </li>
              ))}
          </ul>
        ) : null}
      </PanelSection>
    </div>
  )
}
