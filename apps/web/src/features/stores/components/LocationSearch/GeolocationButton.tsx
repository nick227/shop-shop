/**
 * GeolocationButton - Browser geolocation trigger;
 */
import { memo } from 'react'

interface GeolocationButtonProps {
  onGetLocation: () => void;
  isLoading: boolean;
}

export const GeolocationButton = memo(function GeolocationButton({ onGetLocation, isLoading }: GeolocationButtonProps) {
  return (
    <button
      type="button"
      className=""
      onClick={onGetLocation}
      disabled={isLoading}
      aria-label="Use my current location"
    >
      {isLoading ? (
        <>
          <span className="">⌛</span>
          Getting location...
        </>
      ) : (
        <>
          <span className="">📍</span>
          Use My Location
        </>
      )}
    </button>
  )
})

