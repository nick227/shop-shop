/**
 * MapLegend - Component for rendering map legend;
 * Single Responsibility: Map legend display;
 */

export interface MapLegendProps {
  userLocation?: { latitude: number; longitude: number }
  storeCount: number;
  radiusMiles?: number;
}

export function MapLegend({ userLocation, storeCount, radiusMiles }: MapLegendProps) {
  return (
    <div className="">
      {userLocation && (
        <div className="">
          <span className="">📍</span>
          <span>Your Location</span>
        </div>
      )}
      <div className="">
        <span className="">🍽️</span>
        <span>Restaurants ({storeCount})</span>
      </div>
      {userLocation && radiusMiles && (
        <div className="">
          <span className=""></span>
          <span>{radiusMiles} mi radius</span>
        </div>
      )}
    </div>
  )
}
