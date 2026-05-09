import { useState, useEffect } from 'react'
import { QrCode, Smartphone, Monitor, Navigation, Clock } from 'lucide-react'
import { Button } from '@shared/ui/primitives'
import { buildNavigateUrl, openNavigate, openNavigateNewTab } from '@shared/lib/utils/maps'
import type { LatLng } from '@shared/lib/utils/maps'

export interface CrossDeviceMapSyncProps {
  storeLocation: LatLng
  storeName: string
  deliveryMode: 'PICKUP' | 'DELIVERY'
  userLocation?: LatLng
  onMobileDetected?: () => void
  onDesktopDetected?: () => void
}

export function CrossDeviceMapSync({
  storeLocation,
  storeName,
  deliveryMode,
  userLocation,
  onMobileDetected,
  onDesktopDetected
}: CrossDeviceMapSyncProps) {
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop' | 'unknown'>('unknown')
  const [shareUrl, setShareUrl] = useState<string>('')
  const [qrCode, setQrCode] = useState<string>('')

  useEffect(() => {
    const detectDevice = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth > 768
      
      if (isMobile && !isTablet) {
        setDeviceType('mobile')
        onMobileDetected?.()
      } else {
        setDeviceType('desktop')
        onDesktopDetected?.()
      }
    }

    detectDevice()
    window.addEventListener('resize', detectDevice)
    return () => window.removeEventListener('resize', detectDevice)
  }, [onMobileDetected, onDesktopDetected])

  useEffect(() => {
    // Generate share URL for cross-device sync
    const url = buildNavigateUrl({
      origin: userLocation,
      destination: storeLocation,
      destinationLabel: storeName
    })
    setShareUrl(url)

    // Generate QR code URL (using a simple QR code service)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
    setQrCode(qrUrl)
  }, [storeLocation, storeName, userLocation])

  const handleGetDirections = () => {
    if (deviceType === 'mobile') {
      openNavigate({
        origin: userLocation,
        destination: storeLocation,
        destinationLabel: storeName
      })
    } else {
      openNavigateNewTab({
        origin: userLocation,
        destination: storeLocation,
        destinationLabel: storeName
      })
    }
  }

  const handleShareToMobile = () => {
    if (navigator.share) {
      navigator.share({
        title: `Directions to ${storeName}`,
        text: `Get directions to ${storeName} for ${deliveryMode === 'PICKUP' ? 'pickup' : 'delivery'}`,
        url: shareUrl
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl)
    }
  }

  if (deviceType === 'mobile') {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Mobile Directions</h3>
            <p className="text-sm text-gray-600">
              Get directions to {storeName} for {deliveryMode === 'PICKUP' ? 'pickup' : 'delivery'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={handleGetDirections}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Open Maps
          </Button>
          
          <Button
            variant="outline"
            onClick={handleShareToMobile}
            className="flex-1"
          >
            Share
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
          <Monitor className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Desktop + Phone Sync</h3>
          <p className="text-sm text-gray-600">
            Use your phone for navigation while tracking on desktop
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Desktop Actions */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 text-sm">On Desktop:</h4>
          <Button
            onClick={handleGetDirections}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Open Maps in Browser
          </Button>
          
          <Button
            variant="outline"
            onClick={handleShareToMobile}
            className="w-full"
          >
            Share to Phone
          </Button>
        </div>

        {/* Phone Actions */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 text-sm">On Phone:</h4>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex flex-col items-center">
              {qrCode && (
                <img 
                  src={qrCode} 
                  alt="QR Code for directions" 
                  className="w-32 h-32 mb-2"
                />
              )}
              <p className="text-xs text-gray-600 text-center">
                Scan QR code or tap link below
              </p>
              <a 
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 underline mt-2"
              >
                Open Directions
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <p className="text-sm text-amber-800">
            <strong>Tip:</strong> Keep your phone handy for real-time GPS navigation while tracking your order on desktop.
          </p>
        </div>
      </div>
    </div>
  )
}
