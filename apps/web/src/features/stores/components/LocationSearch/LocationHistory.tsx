/**
 * LocationHistory - Display recent locations with quick access
 */
import type { LocationData } from '@shared/types/types/location.types'

interface LocationHistoryProps {
  readonly history: LocationData[]
  readonly onSelect: (location: LocationData) => void
  readonly onSetDefault: (location: LocationData) => void
}

export function LocationHistory({ history, onSelect, onSetDefault }: LocationHistoryProps) {
  if (history.length === 0) {
    return
  }

  const formatLocationName = (location: LocationData): string => {
    if (location?.displayName) {
      return location.displayName
    }
    
    if (location.city && location?.state) {
      return `${location.city}, ${location.state}`
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
      case 'search':
      case 'manual':
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
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm leading-none">🕒</span>
        <span className="text-sm font-semibold text-foreground">Recent Locations</span>
      </div>
      
      <div className="space-y-1 mt-2 max-h-48 overflow-y-auto">
        {history.map((location, index) => (
          <div
            key={'${location.latitude}-${location.longitude}-' + index + ''}
            className="flex items-center gap-2 p-2 hover:bg-muted rounded-md text-sm cursor-pointer"
            onClick={() => onSelect(location)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(location)
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Select location: ${formatLocationName(location)}`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="text-base leading-none">
                {getLocationIcon(location?.source)}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">
                  {formatLocationName(location)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {location.radiusMiles}mi radius • {formatTimeAgo(location?.timestamp)}
                </div>
              </div>
            </div>
            <button
              className="rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
