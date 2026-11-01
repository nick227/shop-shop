import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { useAddToCart } from '@shared/hooks/hooks/useAddToCart'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { formatDistance } from '@shared/lib/utils/format'
import type { DiscoveryTile, ProductTile } from './tiles'
import { playPop } from './sfx'

function storeHref(id: string, name: string): string {
  return getStoreRoute({ id, name })
}

export function DetailPanel({
  tile,
  anchor,
  related,
  onClose,
}: {
  readonly tile: DiscoveryTile
  readonly anchor?: DOMRect
  readonly related: readonly ProductTile[]
  readonly onClose: () => void
}) {
  const addToCart = useAddToCart()
  const image = tile.image
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [qty, setQty] = useState(1)
  const [entered, setEntered] = useState(false)
  const [fly, setFly] = useState(anchor)
  const [showFly, setShowFly] = useState(Boolean(image && anchor && !reduce))

  useEffect(() => {
    playPop()
    const frame = requestAnimationFrame(() => setEntered(true))
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  useEffect(() => {
    if (reduce || !anchor) return
    const slot = document.querySelector('.detail-photo')
    if (!slot) return
    const next = slot.getBoundingClientRect()
    const id = requestAnimationFrame(() => setFly(next))
    const hide = window.setTimeout(() => setShowFly(false), 320)
    return () => {
      cancelAnimationFrame(id)
      window.clearTimeout(hide)
    }
  }, [anchor, reduce])

  const title = tile.kind === 'product' ? tile.title : tile.kind === 'store' ? tile.name : tile.title
  const storeName = tile.kind === 'product' ? tile.storeName : tile.kind === 'store' ? tile.name : tile.storeName
  const storeId = tile.kind === 'product' ? tile.storeId : tile.kind === 'store' ? tile.id : tile.storeId

  return (
    <>
      <button type="button" className="detail-scrim" aria-label="Close details" onClick={onClose} />
      <aside className={entered ? 'detail-panel is-open' : 'detail-panel'} aria-label={title}>
        <button type="button" className="detail-close" aria-label="Close" onClick={onClose}><X className="h-5 w-5" /></button>
        <div className="detail-photo">
          {image ? <img src={image} alt="" /> : <div className="brand-fall"><span>{title}</span></div>}
        </div>
        <div className="detail-copy">
          {tile.kind === 'story' ? <p className="tile-kicker">{tile.kicker}</p> : null}
          {tile.kind === 'store' ? <p className="tile-kicker">{tile.typeLabel}{tile.distance != undefined ? ` · ${formatDistance(tile.distance)}` : ''}</p> : null}
          {tile.kind === 'product' ? <p className="tile-kicker">{tile.storeName}</p> : null}
          <h2>{title}</h2>
          {tile.kind === 'story' ? <p>{tile.body}</p> : null}
          {tile.kind === 'store' ? <p>{tile.store.description || 'A neighborhood shop in your delivery area.'}</p> : null}
          {tile.kind === 'product' ? (
            <>
              <p className="detail-price">{tile.price}</p>
              {tile.item.description ? <p>{tile.item.description}</p> : null}
              <div className="detail-qty">
                <button type="button" onClick={() => setQty((count) => Math.max(1, count - 1))} aria-label="Fewer">−</button>
                <span>{qty}</span>
                <button type="button" onClick={() => setQty((count) => count + 1)} aria-label="More">+</button>
              </div>
              <button
                type="button"
                className="detail-buy"
                disabled={tile.item.isSoldOut || tile.item.isActive === false || addToCart.isPending}
                onClick={() => addToCart.mutate({
                  storeId: tile.storeId,
                  itemId: tile.id,
                  quantity: qty,
                  title: tile.title,
                  unitPrice: tile.item.price,
                  item: tile.item,
                })}
              >
                {tile.item.isSoldOut ? 'Sold out' : `Add to cart · ${tile.price}`}
              </button>
            </>
          ) : null}
          {tile.kind === 'store' && related.length > 0 ? (
            <ul className="detail-related">
              {related.slice(0, 3).map((product) => (
                <li key={product.id}>{product.title}<span>{product.price}</span></li>
              ))}
            </ul>
          ) : null}
          {storeId && storeName ? (
            <Link to={storeHref(storeId, storeName)} className="detail-store">View store</Link>
          ) : null}
        </div>
      </aside>
      {showFly && image && fly ? (
        <img src={image} alt="" className="detail-flyer" style={{ top: fly.top, left: fly.left, width: fly.width, height: fly.height }} />
      ) : null}
    </>
  )
}
