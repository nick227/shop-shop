/**
 * GeolocationButton - Browser geolocation trigger;
 */
import { memo } from 'react'
import { styles } from '@shared/lib/tailwind-classes'

interface GeolocationButtonProps {
  onGetLocation: () => void;
  isLoading: boolean;
}

export const GeolocationButton = memo(function GeolocationButton({ onGetLocation, isLoading }: GeolocationButtonProps) {
  return (
    <button
      type="button"
      className={styles.geoButton}
      onClick={onGetLocation}
      disabled={isLoading}
      aria-label="Use my current location"
    >
      {isLoading ? (
        <>
          <span className={styles.spinner}>⌛</span>
          Getting location...
        </>
      ) : (
        <>
          <span className={styles.icon}>📍</span>
          Use My Location
        </>
      )}
    </button>
  )
})

