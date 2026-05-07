import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, CameraOff, FlipHorizontal, Download, X, AlertCircle, Check } from 'lucide-react'

interface CameraCaptureProps {
  onCapture: (imageData: File) => void
  onClose: () => void
  maxResolution?: { width: number; height: number }
}

interface CameraDevice {
  deviceId: string
  label: string
  kind: string
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onClose,
  maxResolution = { width: 1920, height: 1080 }
}) => {
  const [isStreaming, setIsStreaming] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<CameraDevice[]>([])
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [isLoading, setIsLoading] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Check camera support and permissions
  const checkCameraSupport = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setDevices(videoDevices)

      if (videoDevices.length === 0) {
        setError('No camera devices found')
        return false
      }

      // Try to get permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      
      setPermissionGranted(true)
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera permissions in your browser settings.')
          setPermissionGranted(false)
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.')
        } else {
          setError('Camera access failed: ' + err.message)
        }
      }
      return false
    }
  }, [])

  // Start camera stream
  const startCamera = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: maxResolution.width },
          height: { ideal: maxResolution.height },
          aspectRatio: { ideal: 16/9 }
        },
        audio: false
      }

      if (currentDeviceId) {
        constraints.video = {
          facingMode: facingMode,
          width: { ideal: maxResolution.width },
          height: { ideal: maxResolution.height },
          aspectRatio: { ideal: 16/9 },
          deviceId: { exact: currentDeviceId }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsStreaming(true)
        setPermissionGranted(true)
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera permissions.')
          setPermissionGranted(false)
        } else if (err.name === 'ConstraintNotSatisfiedError') {
          setError('Camera does not support the requested resolution.')
        } else {
          setError('Failed to start camera: ' + err.message)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [facingMode, currentDeviceId, maxResolution])

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsStreaming(false)
  }, [])

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now()
        })
        
        // Convert to data URL for preview
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
        setCapturedImage(dataUrl)
        onCapture(file)
      }
    }, 'image/jpeg', 0.9)
  }, [onCapture])

  // Switch camera
  const switchCamera = useCallback(() => {
    const newMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newMode)
    stopCamera()
    
    // Restart camera with new facing mode
    setTimeout(() => {
      startCamera()
    }, 100)
  }, [facingMode, startCamera, stopCamera])

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
  }, [])

  // Confirm captured photo
  const confirmPhoto = useCallback(() => {
    if (capturedImage) {
      onClose()
    }
  }, [capturedImage, onClose])

  // Initialize camera on mount
  useEffect(() => {
    checkCameraSupport().then((hasSupport) => {
      if (hasSupport) {
        startCamera()
      }
    })

    return () => {
      stopCamera()
    }
  }, [])

  // Handle device change
  useEffect(() => {
    if (currentDeviceId) {
      stopCamera()
      setTimeout(() => {
        startCamera()
      }, 100)
    }
  }, [currentDeviceId, startCamera, stopCamera])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Camera className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Camera Capture</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative bg-black">
          {capturedImage ? (
            // Show captured image
            <div className="relative">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-auto max-h-[60vh] object-contain"
              />
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span className="text-sm">Captured</span>
              </div>
            </div>
          ) : (
            // Show camera stream
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto max-h-[60vh] object-contain"
              />
              
              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4" />
                    <div>Starting camera...</div>
                  </div>
                </div>
              )}

              {/* Camera controls overlay */}
              {isStreaming && !capturedImage && (
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  {/* Switch camera button */}
                  {devices.length > 1 && (
                    <button
                      onClick={switchCamera}
                      className="bg-white bg-opacity-20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-opacity-30 transition-colors"
                      title="Switch camera"
                    >
                      <FlipHorizontal className="w-6 h-6" />
                    </button>
                  )}

                  {/* Capture button */}
                  <button
                    onClick={capturePhoto}
                    className="bg-white text-gray-800 p-4 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                    title="Capture photo"
                  >
                    <Camera className="w-8 h-8" />
                  </button>

                  {/* Device selector */}
                  {devices.length > 1 && (
                    <select
                      value={currentDeviceId}
                      onChange={(e) => setCurrentDeviceId(e.target.value)}
                      className="bg-white bg-opacity-20 backdrop-blur-sm text-white p-2 rounded-lg border border-white border-opacity-30"
                    >
                      <option value="">Auto</option>
                      {devices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${devices.indexOf(device) + 1}`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center p-8">
              <div className="bg-white rounded-xl p-6 max-w-md text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Camera Error</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                {permissionGranted === false && (
                  <div className="text-sm text-gray-500 mb-4">
                    <p className="mb-2">To enable camera access:</p>
                    <ol className="text-left list-decimal list-inside space-y-1">
                      <li>Click the camera icon in your browser's address bar</li>
                      <li>Select "Allow" for camera permissions</li>
                      <li>Refresh this page</li>
                    </ol>
                  </div>
                )}
                <div className="flex space-x-3">
                  <button
                    onClick={checkCameraSupport}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {permissionGranted === true && !capturedImage && (
              <span>📸 Position your item and tap capture</span>
            )}
            {capturedImage && (
              <span>✅ Photo captured successfully</span>
            )}
          </div>
          
          <div className="flex space-x-3">
            {capturedImage && (
              <>
                <button
                  onClick={retakePhoto}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Retake
                </button>
                <button
                  onClick={confirmPhoto}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Use Photo
                </button>
              </>
            )}
            
            {!capturedImage && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}
