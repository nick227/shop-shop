/**
 * Store Form Sections Builder
 * Extracts section definitions from StoreFormPage for cleaner code
 */
import { Input, TextArea, Checkbox } from '@ui'
import { CharCount, FormRow, CheckboxGroup } from '../../components/templates'
import type { FormSection } from '../../components/templates'
import type { StoreFormData } from '@api/types'

export function createStoreFormSections(
  formData: StoreFormData,
  onChange: (field: keyof StoreFormData, value: string | number | boolean) => void,
  isEdit: boolean
): FormSection[] {
  return [
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

          <Input
            label="Slug (URL) *"
            value={formData.slug}
            onChange={(e) => onChange('slug', e.target.value)}
            placeholder="my-amazing-store"
            helperText="Used in store URL. Lowercase letters, numbers, and hyphens only."
            required
            disabled={isEdit}
          />

          <div>
            <TextArea
              label="Description"
              value={formData.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Tell customers about your store, cuisine type, specialties, and what makes you unique..."
              rows={5}
              maxLength={1000}
            />
            <CharCount current={formData.description.length} max={1000} />
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

          <FormRow>
            <Input
              label="Tax ID / EIN"
              value={formData.taxId}
              onChange={(e) => onChange('taxId', e.target.value)}
              placeholder="12-3456789"
            />

            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </FormRow>

          <FormRow>
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => onChange('email', e.target.value)}
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

            <Input
              label="State *"
              value={formData.addressState}
              onChange={(e) => onChange('addressState', e.target.value.toUpperCase())}
              placeholder="NY"
              maxLength={2}
              required
              helperText="2-letter state code"
            />
          </FormRow>

          <FormRow>
            <Input
              label="ZIP Code *"
              value={formData.addressZip}
              onChange={(e) => onChange('addressZip', e.target.value)}
              placeholder="10001"
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
          </FormRow>
        </>
      ),
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

            <Checkbox
              label="Delivery Enabled"
              checked={formData.deliveryEnabled}
              onChange={(e) => onChange('deliveryEnabled', e.target.checked)}
            />

            <Checkbox
              label="Pickup Enabled"
              checked={formData.pickupEnabled}
              onChange={(e) => onChange('pickupEnabled', e.target.checked)}
            />
          </CheckboxGroup>

          <Input
            label="Preparation Time (minutes)"
            type="number"
            value={formData.prepTimeMin.toString()}
            onChange={(e) => onChange('prepTimeMin', Number.parseInt(e.target.value) || 15)}
            min="5"
            max="120"
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
}

