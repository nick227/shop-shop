/**
 * IconService - Service for managing map icons
 * Single Responsibility: Icon creation and caching
 */
import L from 'leaflet'

// Icon cache (performance optimization - prevents repeated icon creation)
const ICON_CACHE = new Map<string, L.DivIcon>()

export interface IconOptions {
  className?: string
  html?: string
  iconSize?: [number, number]
  iconAnchor?: [number, number]
  popupAnchor?: [number, number]
}

export class IconService {
  static getIcon(key: string, options: IconOptions): L.DivIcon {
    if (!ICON_CACHE.has(key)) {
      ICON_CACHE.set(key, L.divIcon({
        className: options.className || 'custom-marker',
        html: options.html || '<div>📍</div>',
        iconSize: options.iconSize || [40, 40],
        iconAnchor: options.iconAnchor || [20, 40],
        popupAnchor: options.popupAnchor || [0, -40]
      }))
    }
    
    return ICON_CACHE.get(key)!
  }

  static getStoreIcon(isNearest: boolean, styles?: Record<string, string>): L.DivIcon {
    const key = 'store-' + isNearest ? 'nearest' : 'regular' + ''
    const markerClass = styles?.marker || 'w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white cursor-pointer'
    const nearestClass = isNearest ? (styles?.nearestMarker || 'bg-green-600 ring-4 ring-green-200') : ''
    const iconClass = styles?.markerIcon || 'text-xl'
    
    return this.getIcon(key, {
      className: 'custom-store-marker',
      html: '<div class="' + markerClass + ' ' + nearestClass + '"><div class="' + iconClass + '">🍽️</div></div>',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    })
  }

  static getUserIcon(styles?: Record<string, string>): L.DivIcon {
    const userClass = styles?.userMarker || 'w-4 h-4 bg-red-600 rounded-full ring-4 ring-red-200'
    
    return this.getIcon('user', {
      className: 'custom-user-marker',
      html: '<div class="' + userClass + '">📍</div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    })
  }
}
