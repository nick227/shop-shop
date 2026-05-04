/**
 * AddressCard - Display address with edit/delete actions
 */
import { Card, Button } from '@shared/ui/primitives'
import type { AddressResponse as Address } from '@api/types'

export interface AddressCardProps {
  address: Address
  onEdit?: (addressId: string) => void
  onDelete?: (addressId: string) => void
  onSelect?: (addressId: string) => void
  isSelected?: boolean
}

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSelect,
  isSelected,
}: AddressCardProps) {
  const handleSelect = onSelect ? () => onSelect(address.id) : undefined

  return (
    <Card
      onClick={handleSelect}
      className={isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {address.label && (
          <h4 className="">{address.label}</h4>
        )}

        <address className="">
          {address.contactName && <div>{address.contactName}</div>}
          <div>{address.line1}</div>
          {address.line2 && <div>{address.line2}</div>}
          <div>
            {address.city}, {address.state} {address.postalCode}
          </div>
          {address.phone && <div>{address.phone}</div>}
        </address>

        {address.instructions && (
          <p className="">Note: {address.instructions}</p>
        )}

        {(onEdit || onDelete) && (
          <div className="">
            {onEdit && (
              <Button
                variant="ghost"
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(address.id)
                }}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(address.id)
                }}
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

