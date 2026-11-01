import { formatDistance } from '@shared/lib/utils/format'
import type { DiscoveryTile, ProductTile, StoreTile } from './tiles'

export type MarketBlock =
  | { readonly type: 'circles' }
  | { readonly type: 'portraits'; readonly id: string; readonly tiles: readonly ProductTile[] }
  | { readonly type: 'hero'; readonly tile: StoreTile }
  | { readonly type: 'statement'; readonly id: string; readonly kicker: string; readonly text: string }
  | { readonly type: 'callout'; readonly tile: ProductTile }

export function marketBlocks(
  tiles: readonly DiscoveryTile[],
  nearest: readonly StoreTile[],
): readonly MarketBlock[] {
  const products = tiles.filter((tile): tile is ProductTile => tile.kind === 'product')
  const stores = tiles.filter((tile): tile is StoreTile => tile.kind === 'store')
  const closest = nearest[0]
  const blocks: MarketBlock[] = [{ type: 'circles' }]

  if (closest?.distance != undefined) {
    blocks.push({
      type: 'statement',
      id: 'near',
      kicker: 'Around you',
      text: `${closest.name} is ${formatDistance(closest.distance)} from you.`,
    })
  }

  const lead = products.find((item) => item.storeId === closest?.id) ?? products[0]
  if (lead) blocks.push({ type: 'callout', tile: lead })
  if (products.length > 0) blocks.push({ type: 'portraits', id: 'a', tiles: products.slice(0, 4) })
  if (stores[0]) blocks.push({ type: 'hero', tile: stores[0] })
  if (products.length > 4) blocks.push({ type: 'portraits', id: 'b', tiles: products.slice(4, 8) })
  if (stores[1]) blocks.push({ type: 'hero', tile: stores[1] })
  if (products.length > 8) blocks.push({ type: 'portraits', id: 'c', tiles: products.slice(8, 12) })
  return blocks
}
