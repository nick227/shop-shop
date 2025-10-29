/**
 * AvailableLocations - Display available cities and zip codes for users;
 */
import { useAvailableLocations } from '@shared/hooks/store'

interface AvailableLocationsProps {
  readonly onLocationClick?: (city: string, state: string) => void;
}

export function AvailableLocations({ onLocationClick }: AvailableLocationsProps) {
  const { data, isLoading } = useAvailableLocations()

  if (isLoading) {
    return (
      <div className="bg-white/90 rounded-xl p-6 my-8">
        <p className="text-gray-600">Loading available locations...</p>
      </div>
    )
  }

  if (!data || (data.cities.length === 0 && data.zipCodes.length === 0)) {
    return;
  }

  const topCities = data.cities.slice(0, 8)
  const topZipCodes = data.zipCodes.slice(0, 10)

  return (
    <div className="bg-white/90 rounded-xl p-6 my-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">📍 Available Locations</h3>
      
      {topCities.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Cities:</h4>
          <div className="flex flex-wrap gap-2">
            {topCities.map(({ city, state, count }) => (
              <button
                key={city + '-' + state}
                onClick={() => onLocationClick?.(city, state)}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-colors"
              >
                {city}, {state} ({count})
              </button>
            ))}
          </div>
        </div>
      )}
      
      {topZipCodes.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Zip Codes:</h4>
          <div className="flex flex-wrap gap-2">
            {topZipCodes.map(({ zipCode, city, state, count }) => (
              <button
                key={zipCode}
                onClick={() => onLocationClick?.(city, state)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                title={city + ', ' + state}
              >
                {zipCode} ({count})
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

