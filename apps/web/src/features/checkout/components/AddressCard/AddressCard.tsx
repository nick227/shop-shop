/**
 * AddressCard - Display address with edit/delete actions
 */
import { Card, Button } from '@ui'
import type { Address } from '../../../../api/backend-types'
import { styles } from '@utils/tailwind-classes'

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
      className={isSelected ? styles.selected : ''}
    >
      <div className={styles.content}>
        {address.label && (
          <h4 className={styles.label}>{address.label}</h4>
        )}

        <address className={styles.address}>
          {address.contactName && <div>{address.contactName}</div>}
          <div>{address.line1}</div>
          {address.line2 && <div>{address.line2}</div>}
          <div>
            {address.city}, {address.state} {address.postalCode}
          </div>
          {address.phone && <div>{address.phone}</div>}
        </address>

        {address.instructions && (
          <p className={styles.instructions}>Note: {address.instructions}</p>
        )}

        {(onEdit || onDelete) && (
          <div className={styles.actions}>
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

