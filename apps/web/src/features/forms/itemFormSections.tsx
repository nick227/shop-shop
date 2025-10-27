/**
 * Item Form Sections Builder;
 * Extracts section definitions from ItemFormPage for cleaner code;
 */
import { Input, TextArea, Checkbox } from '@ui'
import { CharCount, FormRow, CheckboxGroup } from '../../components/templates'
import type { FormSection } from '../../components/templates'
import type { ItemFormData } from '@api/types'

export function createItemFormSections(
  formData: ItemFormData,
  onChange: (field: keyof ItemFormData, value: string | number | boolean) => void
): FormSection[] {
  return [
    {
      id: 'basic',
      icon: '🍽️',
      title: 'Basic Information',
      description: 'Describe your menu item with an appetizing title, description, and price',
      content: (
        <>
          <Input
            label="Item Title *"
            value={formData.title}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="Delicious Menu Item"
            required
          />

          <div>
            <TextArea
              label="Description"
              value={formData.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Describe ingredients, preparation, allergens, and what makes this item special..."
              rows={4}
              maxLength={1000}
            />
            <CharCount current={formData.description.length} max={1000} />
          </div>

          <FormRow>
            <Input
              label="Price *"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => onChange('price', e.target.value)}
              placeholder="9.99"
              helperText="💲 Price in USD (customers will see this)"
              required
            />

            <Input
              label="Stock Quantity"
              type="number"
              min="0"
              value={formData.stockQty}
              onChange={(e) => onChange('stockQty', e.target.value)}
              placeholder="Optional"
              helperText="📦 Leave empty for unlimited stock"
            />
          </FormRow>

          <Input
            label="Sort Order"
            type="number"
            min="0"
            value={formData.sortIndex.toString()}
            onChange={(e) => onChange('sortIndex', Number.parseInt(e.target.value) || 0)}
            helperText="📌 Lower numbers appear first on your menu (0 = top)"
          />
        </>
      )},
    {
      id: 'availability',
      icon: '📊',
      title: 'Availability',
      description: 'Control when customers can see and order this item',
      content: (
        <CheckboxGroup>
          <Checkbox
            label="Active (visible to customers)"
            checked={formData.isActive}
            onChange={(e) => onChange('isActive', e.target.checked)}
          />

          <Checkbox
            label="Sold Out"
            checked={formData.isSoldOut}
            onChange={(e) => onChange('isSoldOut', e.target.checked)}
          />
        </CheckboxGroup>
      )},
  ]
}

