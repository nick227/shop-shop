import { useState, useEffect, useRef } from 'react'
import { MapPin, Navigation, Clock, Truck, Package } from 'lucide-react'
import { Button } from '@shared/ui/primitives'
import type { LatLng } from '@shared/lib/utils/maps'

export interface DeliveryTrackingMapProps {
  storeLocation: LatLng
  deliveryLocation?: LatLng
  userLocation?: LatLng
  driverLocation?: LatLng
  storeName: string
  deliveryMode: 'PICKUP' | 'DELIVERY' | 'STORE_MANAGED_DELIVERY' | 'PLATFORM_DRIVER'
  estimatedTime?: string
  status: 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'COMPLETED'
  onRefresh?: () => void
}

export function DeliveryTrackingMap({
  storeLocation,
  deliveryLocation,
  userLocation,
  driverLocation,
  storeName,
  deliveryMode,
  estimatedTime,
  status,
  onRefresh
}: DeliveryTrackingMapProps) {
  const [mapUrl, setMapUrl] = useState<string>('')
  const [isTracking, setIsTracking] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Generate dynamic map URL for embedded display
    const generateMapUrl = () => {
      const baseUrl = 'https://www.google.com/maps/embed/v1/view'
      const params = new URLSearchParams({
        key: 'YOUR_API_KEY', // Would need actual API key
        center: `${storeLocation.latitude},${storeLocation.longitude}`,
        zoom: '14',
        maptype: 'roadmap'
      })
      
      // Add markers for different locations
      const markers = []
      
      // Store marker
      markers.push(`markers=color:blue|label:S|${storeLocation.latitude},${storeLocation.longitude}`)
      
      // User/delivery location marker
      if (deliveryLocation) {
        markers.push(`markers=color:red|label:D|${deliveryLocation.latitude},${deliveryLocation.longitude}`)
      }
      
      // Driver marker (if available)
      if (driverLocation) {
        markers.push(`markers=color:green|label:Driver|${driverLocation.latitude},${driverLocation.longitude}`)
      }
      
      if (markers.length > 0) {
        params.append('markers', markers.join('|'))
      }
      
      return `${baseUrl}?${params.toString()}`
    }

    setMapUrl(generateMapUrl())
  }, [storeLocation, deliveryLocation, driverLocation])

  const handleGetDirections = () => {
    const destination = deliveryMode === 'PICKUP' ? storeLocation : deliveryLocation
    
    if (destination) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&destination_label=${encodeURIComponent(storeName)}`
      window.open(url, '_blank')
    }
  }

  const handleStartTracking = () => {
    setIsTracking(true)
    // Would implement real-time tracking logic here
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'PREPARING': return <Package className="w-5 h-5 text-orange-500" />
      case 'READY': return <Clock className="w-5 h-5 text-blue-500" />
      case 'OUT_FOR_DELIVERY': return <Truck className="w-5 h-5 text-green-500" />
      case 'COMPLETED': return <MapPin className="w-5 h-5 text-gray-500" />
      default: return <Package className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'PREPARING': return 'Order is being prepared'
      case 'READY': return 'Order is ready for pickup'
      case 'OUT_FOR_DELIVERY': return 'Driver is on the way'
      case 'COMPLETED': return 'Order has been delivered'
      default: return 'Order processing'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Map Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h3 className="font-semibold text-lg">{storeName}</h3>
              <p className="text-blue-100 text-sm">{getStatusText()}</p>
            </div>
          </div>
          
          {estimatedTime && (
            <div className="text-right">
              <p className="text-blue-100 text-xs">ETA</p>
              <p className="font-semibold">{estimatedTime}</p>
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative">
        <div 
          ref={mapRef}
          className="w-full h-64 bg-gray-100"
          style={{
            backgroundImage: `url(https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-l+555555(${storeLocation.longitude},${storeLocation.latitude}),${storeLocation.longitude},${storeLocation.longitude},14,600x400@2x?access_token=YOUR_MAPBOX_TOKEN)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Fallback static map display */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white opacity-20"></div>
          
          {/* Location Markers Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">{storeName}</p>
              {deliveryLocation && (
                <div className="mt-4">
                  <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mb-1"></div>
                  <p className="text-xs text-gray-600">Delivery Location</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tracking Controls */}
        <div className="absolute top-4 right-4 space-y-2">
          <Button
            size="sm"
            onClick={onRefresh}
            className="bg-white/90 hover:bg-white text-gray-700 shadow-lg"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 space-y-3">
        <div className="flex gap-3">
          <Button
            onClick={handleGetDirections}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Get Directions
          </Button>
          
          {status === 'OUT_FOR_DELIVERY' && !isTracking && (
            <Button
              onClick={handleStartTracking}
              variant="outline"
              className="flex-1"
            >
              <Truck className="w-4 h-4 mr-2" />
              Track Driver
            </Button>
          )}
        </div>

        {/* Status Details */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm font-medium text-gray-900">
                {deliveryMode === 'PICKUP' ? 'Pickup' : 'Delivery'} Status
              </span>
            </div>
            <span className="text-sm text-gray-600">{getStatusText()}</span>
          </div>
          
          {estimatedTime && (
            <div className="mt-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Estimated {deliveryMode === 'PICKUP' ? 'pickup' : 'delivery'}: {estimatedTime}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
