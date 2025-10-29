/**
 * CartItem - Display cart line item with quantity controls
 */
import { Button, Image } from '@shared/ui/primitives'
import type { CartItemData } from '@api/types'
import { formatCurrency } from '@shared/lib/format'
import { parsePrice } from '@api/types'
import { styles } from '@shared/lib/tailwind-classes'

export interface CartItemProps {
  item: CartItemData
  onUpdateQuantity?: (itemId: string, quantity: number) => void
  onRemove?: (itemId: string) => void
  isUpdating?: boolean
}

export function CartItem({ item, onUpdateQuantity, onRemove, isUpdating }: CartItemProps) {
  const unitPrice = parsePrice(item.unitPrice)
  const lineTotal = unitPrice * item.quantity
  
  // @ts-expect-error - imageUrl will be added to CartItemData type when backend supports it
  const imageUrl = item.imageUrl

  const handleIncrement = () => {
    onUpdateQuantity?.(item.id, item.quantity + 1)
  }

  const handleDecrement = () => {
    if (item.quantity > 1) {
      onUpdateQuantity?.(item.id, item.quantity - 1)
    }
  }

  const handleRemove = () => {
    onRemove?.(item.id)
  }

  return (
    <div className={styles.cartItem}>
      <Image
        src={imageUrl || '/placeholder-item-' + item.itemId + '.jpg'}
        alt={item.titleSnapshot || 'Item'}
        fallbackSeed={item.itemId}
        aspectRatio="1/1"
        containerClassName={styles.image}
      />
      <div className={styles.info}>
        <h4 className={styles.title}>{item.titleSnapshot}</h4>
        {item.notes && (
          <p className={styles.notes}>{item.notes}</p>
        )}
      </div>

      <div className={styles.controls}>
        <div className={styles.quantity}>
          <button
            type="button"
            className={styles.quantityButton}
            onClick={handleDecrement}
            disabled={isUpdating || item.quantity <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className={styles.quantityValue}>{item.quantity}</span>
          <button
            type="button"
            className={styles.quantityButton}
            onClick={handleIncrement}
            disabled={isUpdating}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <div className={styles.pricing}>
          <span className={styles.price}>{formatCurrency(lineTotal)}</span>
          <Button
            variant="ghost"
            size="small"
            onClick={handleRemove}
            disabled={isUpdating}
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  )
}

