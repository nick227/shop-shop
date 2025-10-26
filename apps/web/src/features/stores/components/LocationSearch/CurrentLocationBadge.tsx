/**
 * CurrentLocationBadge - Display current selected location;
 */
import { styles } from '@utils/tailwind-classes'

interface CurrentLocationBadgeProps {
  locationName: string;
  radiusMiles: number;
  onClear: () => void;
  onSetDefault?: () => void;
}

export function CurrentLocationBadge({ 
  locationName, 
  radiusMiles, 
  onClear,
  onSetDefault
}: CurrentLocationBadgeProps) {
  return (
    <div className={styles['currentLocation']}>
      <div className={styles['locationInfo']}>
        <span className={styles['locationIcon']}>📍</span>
        <div className={styles['locationText']}>
          <div className={styles['locationName']}>{locationName}</div>
          <div className={styles['locationDetails']}>
            Within {radiusMiles} miles
          </div>
        </div>
      </div>
      <div className={styles['locationActions']}>
        {onSetDefault && (
          <button
            type="button"
            className={styles['defaultButton']}
            onClick={onSetDefault}
            aria-label="Set as default location"
            title="Set as default location"
          >
            ⭐
          </button>
        )}
        <button
          type="button"
          className={styles['clearButton']}
          onClick={onClear}
          aria-label="Clear location"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

