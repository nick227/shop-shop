import { useState, useEffect, type ChangeEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/primitives'
import { Button, Checkbox, Input, TextArea } from '@shared/ui/primitives'
import { Truck, MapPin, Phone, Info, ExternalLink, AlertCircle } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { toast } from 'sonner'
import { getErrorMessage, handleApiError } from '@api/errors'

interface StoreDoorDashConfig {
  inHouseDeliveryEnabled: boolean
  doorDashDeliveryEnabled: boolean
  inHouseDeliveryFee: number
  doorDashDeliveryFee: number
  doorDashInfoUrl: string
  doorDashSupportUrl: string
  minimumOrderAmount: number
  maxDeliveryRadius: number
  pickupContactName: string
  pickupContactPhone: string
  deliveryInstructions: string
}

interface StoreDoorDashConfigSectionProps {
  storeId: string
  initialConfig?: Partial<StoreDoorDashConfig>
  onConfigChange?: (config: StoreDoorDashConfig) => void
  disabled?: boolean
}

export function StoreDoorDashConfigSection({ 
  storeId, 
  initialConfig,
  onConfigChange,
  disabled = false 
}: StoreDoorDashConfigSectionProps) {
  const [config, setConfig] = useState<StoreDoorDashConfig>({
    inHouseDeliveryEnabled: initialConfig?.inHouseDeliveryEnabled ?? false,
    doorDashDeliveryEnabled: initialConfig?.doorDashDeliveryEnabled ?? false,
    inHouseDeliveryFee: initialConfig?.inHouseDeliveryFee ?? 0,
    doorDashDeliveryFee: initialConfig?.doorDashDeliveryFee ?? 0,
    doorDashInfoUrl: initialConfig?.doorDashInfoUrl ?? '',
    doorDashSupportUrl: initialConfig?.doorDashSupportUrl ?? '',
    minimumOrderAmount: initialConfig?.minimumOrderAmount ?? 0,
    maxDeliveryRadius: initialConfig?.maxDeliveryRadius ?? 10,
    pickupContactName: initialConfig?.pickupContactName ?? '',
    pickupContactPhone: initialConfig?.pickupContactPhone ?? '',
    deliveryInstructions: initialConfig?.deliveryInstructions ?? '',
  })

  const [isValidating, setIsValidating] = useState(false)

  // Fetch existing DoorDash configuration
  const { data: existingConfig, isLoading } = useQuery({
    queryKey: ['store-doordash-config', storeId],
    queryFn: async () => {
      const response = await fetch(`/api/stores/${storeId}/doordash-config`)
      if (!response.ok) return null
      return await response.json()
    },
    enabled: !!storeId,
  })

  // Update config when existing config loads
  useEffect(() => {
    if (existingConfig && !initialConfig) {
      setConfig(existingConfig)
    }
  }, [existingConfig, initialConfig])

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (configData: StoreDoorDashConfig) => {
      setIsValidating(true)
      
      // Validate DoorDash configuration before enabling
      if (configData.doorDashDeliveryEnabled) {
        const validation = await validateDoorDashConfig(configData)
        if (!validation.isValid) {
          throw new Error(validation.error)
        }
      }

      const response = await fetch(`/api/stores/${storeId}/doordash-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save DoorDash configuration')
      }

      return await response.json()
    },
    onSuccess: (data) => {
      toast.success('DoorDash configuration saved successfully')
      setConfig(data)
      onConfigChange?.(data)
    },
    onError: (error: unknown) => {
      void handleApiError(error).then((appErr) => {
        toast.error(getErrorMessage(appErr))
      })
    },
    onSettled: () => {
      setIsValidating(false)
    }
  })

  const validateDoorDashConfig = async (configData: StoreDoorDashConfig): Promise<{ isValid: boolean; error?: string }> => {
    if (!configData.doorDashDeliveryEnabled) {
      return { isValid: true }
    }

    const errors = []
    
    if (!configData.pickupContactName?.trim()) {
      errors.push('Pickup contact name is required')
    }
    
    if (!configData.pickupContactPhone?.trim()) {
      errors.push('Pickup contact phone is required')
    }

    if (configData.minimumOrderAmount < 0) {
      errors.push('Minimum order amount must be non-negative')
    }

    if (configData.maxDeliveryRadius <= 0) {
      errors.push('Maximum delivery radius must be positive')
    }

    if (configData.doorDashDeliveryFee < 0) {
      errors.push('DoorDash delivery fee must be non-negative')
    }

    return {
      isValid: errors.length === 0,
      error: errors.length > 0 ? errors[0] : undefined
    }
  }

  const handleSave = () => {
    saveConfigMutation.mutate(config)
  }

  const handleFieldChange = (field: keyof StoreDoorDashConfig, value: any) => {
    const newConfig = { ...config, [field]: value }
    setConfig(newConfig)
    onConfigChange?.(newConfig)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          DoorDash Delivery Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Delivery Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Delivery Options</h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* In-house Delivery */}
            <div className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="inHouseDeliveryEnabled" className="text-sm font-medium">
                  In-house Delivery
                </label>
                <Checkbox
                  id="inHouseDeliveryEnabled"
                  checked={config.inHouseDeliveryEnabled}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleFieldChange('inHouseDeliveryEnabled', e.target.checked)
                  }
                  disabled={disabled}
                />
              </div>
              {config.inHouseDeliveryEnabled && (
                <div className="space-y-2 mt-3">
                  <label htmlFor="inHouseDeliveryFee" className="text-sm font-medium">
                    Delivery Fee
                  </label>
                  <Input
                    id="inHouseDeliveryFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={config.inHouseDeliveryFee}
                    onChange={(e) => handleFieldChange('inHouseDeliveryFee', parseFloat(e.target.value) || 0)}
                    disabled={disabled}
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>

            {/* DoorDash Delivery */}
            <div className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="doorDashDeliveryEnabled" className="text-sm font-medium">
                  DoorDash Delivery
                </label>
                <Checkbox
                  id="doorDashDeliveryEnabled"
                  checked={config.doorDashDeliveryEnabled}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleFieldChange('doorDashDeliveryEnabled', e.target.checked)
                  }
                  disabled={disabled}
                />
              </div>
              {config.doorDashDeliveryEnabled && (
                <div className="space-y-2 mt-3">
                  <label htmlFor="doorDashDeliveryFee" className="text-sm font-medium">
                    Delivery Fee
                  </label>
                  <Input
                    id="doorDashDeliveryFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={config.doorDashDeliveryFee}
                    onChange={(e) => handleFieldChange('doorDashDeliveryFee', parseFloat(e.target.value) || 0)}
                    disabled={disabled}
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DoorDash Configuration */}
        {config.doorDashDeliveryEnabled && (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Info className="w-4 h-4" />
              DoorDash Settings
            </h3>

            {/* Info URLs */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="doorDashInfoUrl" className="text-sm font-medium">
                  DoorDash Info URL
                </label>
                <Input
                  id="doorDashInfoUrl"
                  type="url"
                  value={config.doorDashInfoUrl}
                  onChange={(e) => handleFieldChange('doorDashInfoUrl', e.target.value)}
                  disabled={disabled}
                  placeholder="https://doordash.com/store-info"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="doorDashSupportUrl" className="text-sm font-medium">
                  DoorDash Support URL
                </label>
                <Input
                  id="doorDashSupportUrl"
                  type="url"
                  value={config.doorDashSupportUrl}
                  onChange={(e) => handleFieldChange('doorDashSupportUrl', e.target.value)}
                  disabled={disabled}
                  placeholder="https://doordash.com/support"
                />
              </div>
            </div>

            {/* Delivery Constraints */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="minimumOrderAmount" className="text-sm font-medium">
                  Minimum Order Amount
                </label>
                <Input
                  id="minimumOrderAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={config.minimumOrderAmount}
                  onChange={(e) => handleFieldChange('minimumOrderAmount', parseFloat(e.target.value) || 0)}
                  disabled={disabled}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="maxDeliveryRadius" className="text-sm font-medium">
                  Max Delivery Radius (miles)
                </label>
                <Input
                  id="maxDeliveryRadius"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={config.maxDeliveryRadius}
                  onChange={(e) => handleFieldChange('maxDeliveryRadius', parseFloat(e.target.value) || 0)}
                  disabled={disabled}
                  placeholder="10"
                />
              </div>
            </div>

            {/* Pickup Contact */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Pickup Contact
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="pickupContactName" className="text-sm font-medium">
                    Contact Name
                  </label>
                  <Input
                    id="pickupContactName"
                    value={config.pickupContactName}
                    onChange={(e) => handleFieldChange('pickupContactName', e.target.value)}
                    disabled={disabled}
                    placeholder="Store Manager"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="pickupContactPhone" className="text-sm font-medium">
                    Contact Phone
                  </label>
                  <Input
                    id="pickupContactPhone"
                    type="tel"
                    value={config.pickupContactPhone}
                    onChange={(e) => handleFieldChange('pickupContactPhone', e.target.value)}
                    disabled={disabled}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Instructions */}
            <div className="space-y-2">
              <label htmlFor="deliveryInstructions" className="text-sm font-medium">
                Delivery Instructions
              </label>
              <TextArea
                id="deliveryInstructions"
                value={config.deliveryInstructions}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  handleFieldChange('deliveryInstructions', e.target.value)
                }
                disabled={disabled}
                rows={3}
                placeholder="Special instructions for DoorDash drivers..."
              />
            </div>
          </div>
        )}

        {/* Fee Disclosure Preview */}
        {(config.inHouseDeliveryEnabled || config.doorDashDeliveryEnabled) && (
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Fee Disclosure Preview
            </h4>
            <div className="space-y-2 text-sm">
              {config.inHouseDeliveryEnabled && (
                <div className="flex justify-between">
                  <span>In-house Delivery:</span>
                  <span className="font-medium">${config.inHouseDeliveryFee.toFixed(2)}</span>
                </div>
              )}
              {config.doorDashDeliveryEnabled && (
                <div className="flex justify-between">
                  <span>DoorDash Delivery:</span>
                  <span className="font-medium">${config.doorDashDeliveryFee.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* External Links */}
        {config.doorDashDeliveryEnabled && (config.doorDashInfoUrl || config.doorDashSupportUrl) && (
          <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium">Customer Links</h4>
            <div className="space-y-2">
              {config.doorDashInfoUrl && (
                <Button
                  variant="outline"
                  size="small"
                  className="w-full justify-start"
                  onClick={() => window.open(config.doorDashInfoUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  DoorDash Info
                </Button>
              )}
              {config.doorDashSupportUrl && (
                <Button
                  variant="outline"
                  size="small"
                  className="w-full justify-start"
                  onClick={() => window.open(config.doorDashSupportUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  DoorDash Support
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={disabled || isValidating || saveConfigMutation.isPending}
            className="min-w-[120px]"
          >
            {isValidating || saveConfigMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </div>
            ) : (
              'Save Configuration'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
