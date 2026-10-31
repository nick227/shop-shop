import { Link, useSearchParams } from 'react-router-dom'
import type { ItemResponse, StoreWithDistance } from '@api/types'
import { resolvePrimaryImageUrl } from '@shared/lib/utils/image'
import { getStoreImageUrl } from '@shared/lib/utils/storeAccessors'
import { hasPhoto, readStoreType } from './selectHome'

interface Kind {
  readonly label: string
  readonly q?: string
  readonly browse?: string
  readonly match: RegExp
  readonly storeTypes?: readonly string[]
}

const KINDS: readonly Kind[] = [
  { label: 'Tasty snacks', q: 'snack', match: /snack|fries|chip|cookie|wing|pastry|muffin/i },
  { label: 'Homemade meals', browse: 'food', match: /taco|burrito|bowl|pasta|pizza|meal|quesadilla/i, storeTypes: ['HOME_KITCHEN', 'MEAL_PREP'] },
  { label: 'Groceries', browse: 'grocery', match: /grocery|produce|milk|eggs|bread/i, storeTypes: ['GROCERY'] },
  { label: 'Baked today', q: 'bread', match: /bread|cake|croissant|cookie|muffin|pastry|danish/i, storeTypes: ['BAKERY'] },
  { label: 'Drinks', q: 'coffee', match: /coffee|espresso|latte|shake|tea|soda|drink/i, storeTypes: ['COFFEE'] },
  { label: 'Corner store', browse: 'convenience', match: /convenience|battery|soap|candy/i, storeTypes: ['CONVENIENCE'] },
]

function productPhoto(item: ItemResponse): string | undefined {
  const withImage = item as ItemResponse & { imageUrl?: string }
  return resolvePrimaryImageUrl(withImage.imageUrl, item.mediaAssets) ?? undefined
}

function kindPhoto(
  kind: Kind,
  products: readonly ItemResponse[],
  stores: readonly StoreWithDistance[],
  used: Set<string>,
): string | undefined {
  for (const item of products) {
    if (used.has(item.id) || !kind.match.test(`${item.title} ${item.description ?? ''}`)) continue
    const src = productPhoto(item)
    if (!src) continue
    used.add(item.id)
    return src
  }
  const store = stores.find((candidate) => {
    if (used.has(candidate.id) || !hasPhoto(candidate)) return false
    const type = readStoreType(candidate)
    return Boolean(type && kind.storeTypes?.includes(type))
  }) ?? stores.find((candidate) => !used.has(candidate.id) && hasPhoto(candidate))
  if (!store) return undefined
  used.add(store.id)
  return getStoreImageUrl(store, 'square')
}

export function ProductRange({
  products,
  stores,
}: {
  readonly products: readonly ItemResponse[]
  readonly stores: readonly StoreWithDistance[]
}) {
  const [params] = useSearchParams()
  const used = new Set<string>()

  return (
    <section aria-label="What you can get">
      <div className="section-head">
        <h2>What you can get</h2>
      </div>
      <div className="plate-grid">
        {KINDS.map((kind) => {
          const next = new URLSearchParams(params)
          next.delete('q')
          next.delete('browse')
          if (kind.q) next.set('q', kind.q)
          if (kind.browse) next.set('browse', kind.browse)
          const src = kindPhoto(kind, products, stores, used)
          return (
            <Link
              key={kind.label}
              to={{ pathname: '/search', search: next.toString() }}
              className="plate"
            >
              {src ? <img src={src} alt="" /> : <div className="tile-fallback" />}
              <strong>{kind.label}</strong>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
