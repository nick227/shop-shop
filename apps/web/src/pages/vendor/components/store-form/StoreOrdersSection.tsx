import { Checkbox, Input } from '@shared/ui/primitives'
import { FormRow } from '@shared/ui/templates'
import type { StoreFieldProps } from './storeFieldProps'

export function StoreOrdersSection({ formData, onChange }: StoreFieldProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <div className="rounded-md border border-border px-4 py-3">
          <Checkbox
            id="delivery-enabled"
            label="Delivery"
            checked={formData.deliveryEnabled}
            onChange={(e) => onChange('deliveryEnabled', e.target.checked)}
          />
        </div>
        <div className="rounded-md border border-border px-4 py-3">
          <Checkbox
            id="pickup-enabled"
            label="Pickup"
            checked={formData.pickupEnabled}
            onChange={(e) => onChange('pickupEnabled', e.target.checked)}
          />
        </div>
      </div>

      <Input
        label="Preparation time (minutes)"
        type="number"
        value={formData.prepTimeMin.toString()}
        onChange={(e) => onChange('prepTimeMin', Number.parseInt(e.target.value, 10) || 15)}
      />

      {formData.deliveryEnabled && (
        <FormRow>
          <Input
            label="Delivery radius (miles)"
            type="number"
            value={formData.deliveryDistance}
            onChange={(e) => onChange('deliveryDistance', e.target.value)}
            min="0"
            step="0.01"
            placeholder="5.0"
          />
          <Input
            label="Delivery fee ($)"
            type="number"
            value={formData.deliveryCharge}
            onChange={(e) => onChange('deliveryCharge', e.target.value)}
            min="0"
            step="0.01"
            placeholder="3.99"
          />
        </FormRow>
      )}

      <Checkbox
        id="store-published"
        label="Visible to customers"
        checked={formData.isPublished}
        onChange={(e) => onChange('isPublished', e.target.checked)}
      />
    </section>
  )
}
