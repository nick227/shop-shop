/**
 * LocationHistory - Display recent locations with quick access
 */
import type { LocationData } from '@/types/location.types'
import { styles } from '@utils/tailwind-classes'

interface LocationHistoryProps {
  history: LocationData[]
  onSelect: (location: LocationData) => void
  onSetDefault: (location: LocationData) => void
}

export function LocationHistory({ history, onSelect, onSetDefault }: LocationHistoryProps) {
  if (history.length === 0) {
    return null
  }

  const formatLocationName = (location: LocationData): string => {
    if (location?.displayName) {
      return location.displayName
    }
    
    if (location["city"] && location?.["state"]) {
      return `${location["city"]}, ${location["state"]}`
    }
    
    if (location?.zip) {
      return `ZIP ${location.zip}`
    }
    
    return 'Unknown Location'
  }

  const getLocationIcon = (source: LocationData["source"]): string => {
    switch (source) {
      case 'geolocation': {
        return '📍'
      }
      case 'zip': {
        return '📮'
      }
      case 'city': {
        return '🏙️'
      }
      case 'address': {
        return '🏠'
      }
      default: {
        return '📍'
      }
    }
  }

  const formatTimeAgo = (timestamp?: number): string => {
    if (!timestamp) return ''
    
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return '' + minutes + 'm ago'
    if (hours < 24) return '' + hours + 'h ago'
    return '' + days + 'd ago'
  }

  return (
    <div className={styles['historyContainer']}>
      <div className={styles['historyHeader']}>
        <span className={styles['historyIcon']}>🕒</span>
        <span className={styles['historyTitle']}>Recent Locations</span>
      </div>
      
      <div className={styles['historyList']}>
        {history.map((location, index) => (
          <div
            key={'${location.latitude}-${location.longitude}-' + index + ''}
            className={styles['historyItem']}
            onClick={() => onSelect(location)}
          >
            <div className={styles['historyItemContent']}>
              <span className={styles['historyItemIcon']}>
                {getLocationIcon(location?.source)}
              </span>
              <div className={styles['historyItemText']}>
                <div className={styles['historyItemName']}>
                  {formatLocationName(location)}
                </div>
                <div className={styles['historyItemMeta']}>
                  {location.radiusMiles}mi radius • {formatTimeAgo(location?.timestamp)}
                </div>
              </div>
            </div>
            <button
              className={styles['historyItemButton']}
              onClick={(e) => {
                e.stopPropagation()
                onSetDefault(location)
              }}
              title="Set as default location"
            >
              ⭐
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
