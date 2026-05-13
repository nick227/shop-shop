/**
 * Store Form Sections Builder
 * Extracts section definitions from StoreFormPage for cleaner code
 */
import { Input, TextArea, Checkbox, Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@shared/ui/primitives'
import { CharCount, FormRow, CheckboxGroup } from '@shared/ui/templates'
import type { FormSection } from '@shared/ui/templates'
import type { StoreFormData } from '@api/types'
import { EnhancedMediaGalleryManager } from '@shared/ui/media'
import { maskEmailInput, maskUsPhoneInput, maskUsZipInput } from '@shared/lib/utils/fieldInputMasks'
import { US_STATES } from '@shared/lib/constants/usStates'
import { StoreHoursEditor } from './components/StoreHoursEditor'

export function createStoreFormSections(
  formData: StoreFormData,
  onChange: <K extends keyof StoreFormData>(field: K, value: StoreFormData[K]) => void,
  isEdit: boolean,
  storeId?: string,
  scopedMediaQueue?: {
    readonly files: readonly File[]
    onFilesChange: (files: File[]) => void
  },
): FormSection[] {
  const addressStateCode = (formData.addressState ?? '').toUpperCase()
  const showOrphanStateOption =
    Boolean(addressStateCode) && !US_STATES.some((s) => s.code === addressStateCode)

  const sections: FormSection[] = [
    {
      id: 'basic',
      icon: '📝',
      title: 'Basic Information',
      description: 'Choose a memorable name and describe what makes your store special',
      content: (
        <>
          <Input
            label="Store Name *"
            value={formData.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="My Amazing Store"
            required
          />

          <Select
            value={formData.storeType || ''}
            onValueChange={(value) => onChange('storeType', value as StoreFormData['storeType'])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select store type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RESTAURANT">Restaurant</SelectItem>
              <SelectItem value="CONVENIENCE">Convenience Store</SelectItem>
              <SelectItem value="GROCERY">Grocery Store</SelectItem>
              <SelectItem value="HOME_KITCHEN">Home Kitchen</SelectItem>
              <SelectItem value="BAKERY">Bakery</SelectItem>
              <SelectItem value="RETAIL">Retail Store</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>

          <div>
            <TextArea
              label="Description"
              value={formData.description ?? ''}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Tell customers about your store, cuisine type, specialties, and what makes you unique..."
              rows={5}
              maxLength={1000}
            />
            <CharCount current={(formData.description ?? '').length} max={1000} />
          </div>
        </>
      ),
    },
    {
      id: 'company',
      icon: '🏢',
      title: 'Company Information',
      description: 'Add your business details for customer trust and invoicing',
      content: (
        <>
          <Input
            label="Company Name"
            value={formData.companyName}
            onChange={(e) => onChange('companyName', e.target.value)}
            placeholder="ACME Corporation"
          />

          <Input
            label="Phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={formData.phone}
            onChange={(e) => onChange('phone', maskUsPhoneInput(e.target.value))}
            placeholder="+1 (555) 123-4567"
          />

          <FormRow>
            <Input
              label="Email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={formData.email}
              onChange={(e) => onChange('email', maskEmailInput(e.target.value))}
              placeholder="contact@store.com"
            />

            <Input
              label="Website"
              type="url"
              value={formData.website}
              onChange={(e) => onChange('website', e.target.value)}
              placeholder="https://www.store.com"
            />
          </FormRow>
        </>
      ),
    },
    {
      id: 'social',
      icon: '🔗',
      title: 'Social & Contact Links',
      description: 'Add your social media handles so customers can find and follow you',
      content: (
        <>
          <Input
            label="Custom Domain"
            type="url"
            value={formData.customDomain}
            onChange={(e) => onChange('customDomain', e.target.value)}
            placeholder="https://mybakery.com"
            helperText="Your own domain name if you have one"
          />

          <FormRow>
            <Input
              label="YouTube"
              value={formData.socialYoutube}
              onChange={(e) => onChange('socialYoutube', e.target.value)}
              placeholder="@YourChannel"
            />
            <Input
              label="Instagram"
              value={formData.socialInstagram}
              onChange={(e) => onChange('socialInstagram', e.target.value)}
              placeholder="@yourhandle"
            />
          </FormRow>

          <FormRow>
            <Input
              label="Facebook"
              value={formData.socialFacebook}
              onChange={(e) => onChange('socialFacebook', e.target.value)}
              placeholder="YourPageName"
            />
            <Input
              label="TikTok"
              value={formData.socialTiktok}
              onChange={(e) => onChange('socialTiktok', e.target.value)}
              placeholder="@yourhandle"
            />
          </FormRow>

          <FormRow>
            <Input
              label="X / Twitter"
              value={formData.socialTwitter}
              onChange={(e) => onChange('socialTwitter', e.target.value)}
              placeholder="@yourhandle"
            />
            <Input
              label="Snapchat"
              value={formData.socialSnapchat}
              onChange={(e) => onChange('socialSnapchat', e.target.value)}
              placeholder="@yourhandle"
            />
          </FormRow>

          <FormRow>
            <Input
              label="WhatsApp"
              type="tel"
              value={formData.socialWhatsapp}
              onChange={(e) => onChange('socialWhatsapp', e.target.value)}
              placeholder="+15551234567"
              helperText="Phone number with country code"
            />
            <Input
              label="Discord"
              value={formData.socialDiscord}
              onChange={(e) => onChange('socialDiscord', e.target.value)}
              placeholder="https://discord.gg/invite"
              helperText="Server invite link"
            />
          </FormRow>
        </>
      ),
    },
    {
      id: 'address',
      icon: '📍',
      title: 'Store Address',
      description: 'Address is required for geocoding and location-based features',
      content: (
        <>
          <Input
            label="Street Address *"
            value={formData.addressStreet}
            onChange={(e) => onChange('addressStreet', e.target.value)}
            placeholder="123 Main Street"
            required
            helperText="📌 Critical for geocoding and delivery distance calculations"
          />

          <FormRow>
            <Input
              label="City *"
              value={formData.addressCity}
              onChange={(e) => onChange('addressCity', e.target.value)}
              placeholder="New York"
              required
            />

            <div className="w-full space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="store-address-state">
                State *
              </label>
              <Select
                value={addressStateCode}
                onValueChange={(value) => onChange('addressState', value)}
                required
              >
                <SelectTrigger id="store-address-state">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {showOrphanStateOption && (
                    <SelectItem value={addressStateCode}>{addressStateCode}</SelectItem>
                  )}
                  {US_STATES.map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.name} ({s.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">2-letter state code</p>
            </div>

            <Input
              label="ZIP Code *"
              inputMode="numeric"
              autoComplete="postal-code"
              value={formData.addressZip}
              onChange={(e) => onChange('addressZip', maskUsZipInput(e.target.value))}
              placeholder="10001"
              maxLength={10}
              pattern="\d{5}(-\d{4})?"
              required
            />

            <Input
              label="Country"
              value={formData.addressCountry}
              onChange={(e) => onChange('addressCountry', e.target.value.toUpperCase())}
              placeholder="US"
              maxLength={2}
              disabled
              helperText="2-letter country code"
            />
          </FormRow>

          <FormRow>
            <Input
              label="Latitude (optional)"
              type="number"
              value={formData.latitude}
              onChange={(e) => onChange('latitude', e.target.value)}
              placeholder="40.7128"
              step="0.00000001"
              helperText="Auto-geocoded from address"
            />

            <Input
              label="Longitude (optional)"
              type="number"
              value={formData.longitude}
              onChange={(e) => onChange('longitude', e.target.value)}
              placeholder="-74.0060"
              step="0.00000001"
              helperText="Auto-geocoded from address"
            />

            <div className="flex items-end">
              <button
                type="button"
                onClick={async () => {
                  if (navigator.geolocation) {
                    try {
                      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                          enableHighAccuracy: true,
                          timeout: 10_000,
                          maximumAge: 0
                        })
                      })
                      onChange('latitude', position.coords.latitude.toString())
                      onChange('longitude', position.coords.longitude.toString())
                    } catch (error) {
                      console.error('Error getting location:', error)
                      alert('Unable to get your location. Please enter coordinates manually.')
                    }
                  } else {
                    alert('Geolocation is not supported by your browser.')
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md transition-colors hover:bg-blue-600"
              >
                📍 Allow Location
              </button>
            </div>
          </FormRow>
        </>
      ),
    },
    {
      id: 'delivery',
      icon: '🚚',
      title: 'Delivery Capability',
      description: 'Choose if you offer delivery to customers',
      content: (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Delivery Options</h3>
            <p className="text-sm text-blue-700 mb-4">
              Select which fulfillment options you offer. Stores without delivery will only appear in pickup searches and won't be included in delivery routing.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="delivery-enabled"
                  checked={formData.deliveryEnabled}
                  onChange={(e) => onChange('deliveryEnabled', e.target.checked)}
                />
                <label htmlFor="delivery-enabled" className="text-sm font-medium text-gray-900">
                  <span className="font-semibold">I offer delivery</span>
                  <span className="block text-xs text-gray-500 mt-1">
                    Customers can order delivery from your store
                  </span>
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="pickup-enabled"
                  checked={formData.pickupEnabled}
                  onChange={(e) => onChange('pickupEnabled', e.target.checked)}
                />
                <label htmlFor="pickup-enabled" className="text-sm font-medium text-gray-900">
                  <span className="font-semibold">I offer pickup</span>
                  <span className="block text-xs text-gray-500 mt-1">
                    Customers can pick up orders from your store
                  </span>
                </label>
              </div>
            </div>
          </div>
          
          {formData.deliveryEnabled && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-900 mb-2">Delivery Requirements</h4>
              <p className="text-xs text-yellow-700">
                To enable delivery, you'll need to set delivery hours, delivery zones, and delivery fees in the next sections.
              </p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'hours',
      icon: '🕐',
      title: 'Store Hours',
      description: 'Set your operating hours and delivery schedule',
      content: (
        <StoreHoursEditor
          value={formData.hoursJson as any}
          onChange={(hours) => onChange('hoursJson', hours)}
          deliveryEnabled={formData.deliveryEnabled}
        />
      )
    },
    {
      id: 'settings',
      icon: '⚙️',
      title: 'Store Settings',
      description: 'Configure how your store operates and appears to customers',
      content: (
        <>
          <CheckboxGroup>
            <Checkbox
              label="Published (visible to customers)"
              checked={formData.isPublished}
              onChange={(e) => onChange('isPublished', e.target.checked)}
            />
          </CheckboxGroup>

          <Input
            label="Preparation Time (minutes)"
            type="number"
            value={formData.prepTimeMin.toString()}
            onChange={(e) => onChange('prepTimeMin', Number.parseInt(e.target.value) || 15)}
            helperText="⏱️ Average time to prepare orders (shown to customers at checkout)"
          />

          <FormRow>
            <Input
              label="Preferred Delivery Distance (miles)"
              type="number"
              value={formData.deliveryDistance}
              onChange={(e) => onChange('deliveryDistance', e.target.value)}
              min="0"
              step="0.01"
              placeholder="e.g., 5.0"
              helperText="Used in search and distance calculations"
            />

            <Input
              label="Delivery Charge ($)"
              type="number"
              value={formData.deliveryCharge}
              onChange={(e) => onChange('deliveryCharge', e.target.value)}
              min="0"
              step="0.01"
              placeholder="e.g., 3.99"
              helperText="Applied to delivery orders at checkout"
            />
          </FormRow>
        </>
      ),
    },
  ]

  // Always show media section for both create and edit
  // For create: queue files locally until store exists, then StoreForm uploads after POST /stores
  // For edit: storeId exists, uploads go to API immediately
  sections.push({
    id: 'media',
    icon: '📸',
    title: 'Store Media',
    description: isEdit 
      ? 'Upload images and videos to showcase your store. The first image will be primary thumbnail.'
      : 'Choose images and videos now — they upload automatically right after you create the store. Then pick a thumbnail.',
    content: (
      <EnhancedMediaGalleryManager
        storeId={storeId}
        maxFiles={100}
        thumbnailUrl={formData.imageUrl}
        onThumbnailChange={(url) =>
          onChange('imageUrl', url)
        }
        thumbnailLabel="Store thumbnail"
        pendingScopedMediaFiles={scopedMediaQueue ? [...scopedMediaQueue.files] : undefined}
        onPendingScopedMediaFilesChange={scopedMediaQueue?.onFilesChange}
      />
    ),
  })

  return sections
}
