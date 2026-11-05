/**
 * Fulfillment and tax: how shoppers can get their order, what delivery costs and covers, and what the
 * store sells for sales tax. Shoppers see delivery only where these settings allow it.
 */
import { Checkbox, Input } from '@shared/ui/primitives'
import { FormRow } from '@shared/ui/templates'
import type { StoreFieldProps } from './storeFieldProps'
import { TAX_CATEGORY_OPTIONS } from '@shared/lib/tax/taxCategories'


export function StoreOrdersSection({ formData, onChange }: StoreFieldProps) {
  const radius = Number.parseFloat(formData.deliveryDistance || '0')
  const missingArea = formData.deliveryEnabled && (Number.isNaN(radius) || radius <= 0)
  const neither = !formData.deliveryEnabled && !formData.pickupEnabled

  return (
    <section className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-medium">How shoppers get their order</legend>
        <div className="rounded-md border border-border px-4 py-3">
          <Checkbox
            id="pickup-enabled"
            label="Pickup"
            checked={formData.pickupEnabled}
            onChange={(e) => onChange('pickupEnabled', e.target.checked)}
          />
        </div>
        <div className="rounded-md border border-border px-4 py-3">
          <Checkbox
            id="delivery-enabled"
            label="Delivery"
            checked={formData.deliveryEnabled}
            onChange={(e) => onChange('deliveryEnabled', e.target.checked)}
          />
        </div>
        {neither ? (
          <p role="alert" className="text-sm text-destructive">
            Turn on pickup or delivery, or shoppers can’t order.
          </p>
        ) : null}
      </fieldset>

      <Input
        label="Ready in (minutes)"
        type="number"
        value={formData.prepTimeMin.toString()}
        onChange={(e) => onChange('prepTimeMin', Number.parseInt(e.target.value, 10) || 15)}
        helperText="Shown to shoppers as the pickup time."
      />

      {formData.deliveryEnabled ? (
        <div className="space-y-2">
          <FormRow>
            <Input
              label="Delivery radius (miles)"
              type="number"
              value={formData.deliveryDistance}
              onChange={(e) => onChange('deliveryDistance', e.target.value)}
              min="0"
              step="0.1"
              placeholder="5"
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
            <Input
              label="Delivery minimum ($)"
              type="number"
              value={formData.deliveryMinimum ?? ''}
              onChange={(e) => onChange('deliveryMinimum', e.target.value)}
              min="0"
              step="0.01"
              placeholder="No minimum"
            />
          </FormRow>
          {missingArea ? (
            <p role="alert" className="text-sm text-amber-700 dark:text-amber-400">
              Set a delivery radius. Until then shoppers see pickup only.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Shoppers within {radius} miles can choose delivery.</p>
          )}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="default-tax-category" className="text-sm font-medium">
          What you sell, for sales tax
        </label>
        <select
          id="default-tax-category"
          value={formData.defaultTaxCategory ?? ''}
          onChange={(e) => onChange('defaultTaxCategory', e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Automatic, from your store type</option>
          {TAX_CATEGORY_OPTIONS.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <p className="text-sm text-muted-foreground">Items can override this, for example bottled water in a restaurant.</p>
      </div>
    </section>
  )
}
