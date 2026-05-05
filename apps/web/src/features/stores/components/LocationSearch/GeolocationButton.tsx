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
      className="flex min-h-11 w-full items-center justify-center gap-3 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      onClick={onGetLocation}
      disabled={isLoading}
      aria-label="Use my current location"
    >
      {isLoading ? (
        <>
          <span className="text-base leading-none">⌛</span>
          Getting location...
        </>
      ) : (
        <>
          <span className="text-base leading-none">📍</span>
          Use My Location
        </>
      )}
    </button>
  )
})

