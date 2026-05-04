// @ts-nocheck
/**
 * UserLocationMarker - Component for rendering user location marker and radius
 * Single Responsibility: User location visualization
 */
import { Marker, Popup, Circle } from 'react-leaflet'
import { IconService } from '../services/iconService'
import { ColorService } from '../services/colorService'
import type { LocationCoordinates } from '@shared/types/types/component-props'

export interface UserLocationMarkerProps {
  userLocation: LocationCoordinates
  radiusMiles?: number
}

export function UserLocationMarker({ userLocation, radiusMiles }: UserLocationMarkerProps) {
  const userIcon = IconService.getUserIcon(styles)
  const circleOptions = ColorService.getCircleOptions()
  const radiusMeters = radiusMiles ? radiusMiles * 1609.34 : 0

  return (
    <>
      <Marker
        position={[Number(userLocation?.latitude), Number(userLocation?.longitude)]}
        icon={userIcon}
      >
        <Popup>
          <div className="">
            <strong>Your Location</strong>
          </div>
        </Popup>
      </Marker>
      
      {radiusMeters > 0 && (
        <Circle
          center={[Number(userLocation?.latitude), Number(userLocation?.longitude)]}
          radius={radiusMeters}
          pathOptions={circleOptions}
        />
      )}
    </>
  )
}
