/**
 * OptimizedStoreMarkers - Batch rendering of store markers with minimal re-renders
 * Single Responsibility: Efficient marker rendering with consolidated operations
 */
import { memo, useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import type L from 'leaflet'
import { formatDistance } from '@utils/format'
import { styles } from '@utils/tailwind-classes'
import type { StoreWithDistance, StoreClickHandler } from '@api/types'

export interface OptimizedStoreMarkersProps {
  stores: StoreWithDistance[]
  nearestStoreId?: string
  onStoreClick?: StoreClickHandler
  regularIcon: L.DivIcon
  nearestIcon: L.DivIcon
}

// Memoized individual marker component to prevent unnecessary re-renders
const StoreMarker = memo(({ 
  store, 
  isNearest, 
  onStoreClick, 
  icon 
}: {
  store: StoreWithDistance
  isNearest: boolean
  onStoreClick?: StoreClickHandler
  icon: L.DivIcon
}) => {
  const handleClick = useMemo(() => 
    onStoreClick ? () => onStoreClick(store) : undefined,
    [onStoreClick, store]
  )

  return (
    <Marker
      position={[Number(store.latitude || 0), Number(store.longitude || 0)]}
      icon={icon}
      eventHandlers={handleClick ? { click: handleClick } : {}}
    >
      <Popup>
        <div className={styles['popup']}>
          <h3 className={styles['popupTitle']}>{store.name}</h3>
          {store.description && (
            <p className={styles['popupDescription']}>{store.description}</p>
          )}
          {store.distance !== undefined && (
            <div className={styles['popupDistance']}>
              📍 {formatDistance(store.distance)} away
            </div>
          )}
          {(store.addressCity || store.addressState) && (
            <div className={styles['popupAddress']}>
              {store.addressStreet && <div>{store.addressStreet}</div>}
              <div>{store.addressCity}, {store.addressState} {store.addressZip}</div>
            </div>
          )}
          {onStoreClick && (
            <button 
              className={styles['popupButton']}
              onClick={() => onStoreClick(store)}
            >
              View Menu →
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  )
})

StoreMarker.displayName = 'StoreMarker'

export const OptimizedStoreMarkers = memo(({ 
  stores, 
  nearestStoreId, 
  onStoreClick, 
  regularIcon, 
  nearestIcon 
}: OptimizedStoreMarkersProps) => {
  // Pre-calculate which stores are nearest to avoid repeated comparisons
  const storeData = useMemo(() => 
    stores.map(store => ({
      store,
      isNearest: store.id === nearestStoreId,
      icon: store.id === nearestStoreId ? nearestIcon : regularIcon
    })),
    [stores, nearestStoreId, regularIcon, nearestIcon]
  )

  return (
    <>
      {storeData.map(({ store, isNearest, icon }) => (
        <StoreMarker
          key={store.id}
          store={store}
          isNearest={isNearest}
          {...(onStoreClick ? { onStoreClick } : {})}
          icon={icon}
        />
      ))}
    </>
  )
})

OptimizedStoreMarkers.displayName = 'OptimizedStoreMarkers'
