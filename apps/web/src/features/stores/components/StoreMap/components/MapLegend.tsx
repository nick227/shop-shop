/**
 * MapLegend - Component for rendering map legend;
 * Single Responsibility: Map legend display;
 */
import { styles } from '@utils/tailwind-classes'

export interface MapLegendProps {
  userLocation?: { latitude: number; longitude: number }
  storeCount: number;
  radiusMiles?: number;
}

export function MapLegend({ userLocation, storeCount, radiusMiles }: MapLegendProps) {
  return (
    <div className={styles.legend}>
      {userLocation && (
        <div className={styles.legendItem}>
          <span className={styles.legendIcon}>📍</span>
          <span>Your Location</span>
        </div>
      )}
      <div className={styles.legendItem}>
        <span className={styles.legendIcon}>🍽️</span>
        <span>Restaurants ({storeCount})</span>
      </div>
      {userLocation && radiusMiles && (
        <div className={styles.legendItem}>
          <span className={styles.legendCircle}></span>
          <span>{radiusMiles} mi radius</span>
        </div>
      )}
    </div>
  )
}
