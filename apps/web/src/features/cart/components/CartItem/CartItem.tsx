/**
 * CartItem - Display cart line item with quantity controls
 */
import { Button, Image } from '@shared/ui/primitives'
import type { CartItemData } from '@api/types'
import { formatCurrency } from '@shared/lib/format'
import { parsePrice } from '@api/types'

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
    <div className="flex gap-4 p-4 border-b last:border-0">
      <Image
        src={imageUrl || '/placeholder-item-' + item.itemId + '.jpg'}
        alt={item.titleSnapshot || 'Item'}
        fallbackSeed={item.itemId}
        aspectRatio="1/1"
        containerClassName="w-24 h-24 rounded-md overflow-hidden flex-shrink-0"
      />
      <div className="">
        <h4 className="mb-2 text-3xl font-bold text-gray-900">{item.titleSnapshot}</h4>
        {item.notes && (
          <p className="">{item.notes}</p>
        )}
      </div>

      <div className="">
        <div className="">
          <button
            type="button"
            className=""
            onClick={handleDecrement}
            disabled={isUpdating || item.quantity <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="">{item.quantity}</span>
          <button
            type="button"
            className=""
            onClick={handleIncrement}
            disabled={isUpdating}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <div className="">
          <span className="font-bold text-primary">{formatCurrency(lineTotal)}</span>
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

