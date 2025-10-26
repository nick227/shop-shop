/**
 * StoreMarker - Component for rendering individual store markers;
 * Single Responsibility: Store marker rendering;
 */
import { Marker, Popup } from 'react-leaflet'
import type L from 'leaflet'
import { formatDistance } from '@utils/format'
import { styles } from '@utils/tailwind-classes'
import type { StoreWithDistance, StoreClickHandler } from '@api/types'

export interface StoreMarkerProps {
  store: StoreWithDistance;
  isNearest: boolean;
  onStoreClick?: StoreClickHandler;
  icon: L.DivIcon;
}

export function StoreMarker({ store, isNearest, onStoreClick, icon }: StoreMarkerProps) {
  return (
    <Marker
      position={[Number(store.latitude || 0), Number(store.longitude || 0)]}
      icon={icon}
      eventHandlers={{
        click: () => onStoreClick?.(store)
      }}
    >
      <Popup>
        <div className={styles['popup']}>
          <h3 className={styles['popupTitle']}>{store.name}</h3>
          {store.description && (
            <p className={styles['popupDescription']}>{store.description}</p>
          )}
          {store.distance !== undefined && (
            <div className={styles['popupDistance']}>
              📍 {formatDistance(store.distance)} away;
            </div>
          )}
          {(store.addressCity || store.addressState) && (
            <div className={styles['popupAddress']}>
              {store.addressStreet && <div>{store.addressStreet}</div>}
              <div>{store.addressCity}, {store.addressState} {store.addressZip}</div>
            </div>
          )}
          <button
            className={styles['popupButton']}
            onClick={() => onStoreClick?.(store)}
          >
            View Menu →
          </button>
        </div>
      </Popup>
    </Marker>
  )
}
