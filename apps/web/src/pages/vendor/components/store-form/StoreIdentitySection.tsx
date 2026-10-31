import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TextArea,
} from '@shared/ui/primitives'
import { CharCount } from '@shared/ui/templates'
import type { StoreFormData } from '@api/types'
import type { StoreFieldProps } from './storeFieldProps'

const STORE_TYPES: ReadonlyArray<{ value: StoreFormData['storeType']; label: string }> = [
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'CONVENIENCE', label: 'Convenience store' },
  { value: 'GROCERY', label: 'Grocery store' },
  { value: 'HOME_KITCHEN', label: 'Home kitchen' },
  { value: 'BAKERY', label: 'Bakery' },
  { value: 'RETAIL', label: 'Retail store' },
  { value: 'OTHER', label: 'Other' },
]

export function StoreIdentitySection({ formData, onChange }: StoreFieldProps) {
  return (
    <section id="store" className="scroll-mt-6 space-y-6">
      <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
        <Input
          label="Store name *"
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Northside Bakery"
          required
        />

        <div className="w-full space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="store-type">
            Type
          </label>
          <Select
            value={formData.storeType || ''}
            onValueChange={(value) => onChange('storeType', value as StoreFormData['storeType'])}
          >
            <SelectTrigger id="store-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {STORE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <TextArea
          label="Description"
          value={formData.description ?? ''}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="What you sell"
          rows={5}
          maxLength={1000}
        />
        <CharCount current={(formData.description ?? '').length} max={1000} />
      </div>
    </section>
  )
}
