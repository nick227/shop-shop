import { Checkbox, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, TextArea } from '@shared/ui/primitives'
import type { StoreFormData } from '@api/types'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { hasText, type StoreFieldProps } from './storeFieldProps'
import { STORE_TYPES } from './storeTypes'

interface StoreIdentitySectionProps extends StoreFieldProps {
  readonly storeId?: string
}

export function StoreIdentitySection({ formData, onChange, storeId }: StoreIdentitySectionProps) {
  const length = (formData.description ?? '').length
  const publicPath = storeId && hasText(formData.name) ? getStoreRoute({ id: storeId, name: formData.name }) : ''

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Checkbox
          id="store-published"
          label="Public"
          checked={formData.isPublished}
          onChange={(e) => onChange('isPublished', e.target.checked)}
        />
        {publicPath ? (
          <a
            href={publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            {publicPath}
          </a>
        ) : null}
      </div>

      <div className="w-full space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="store-type">
          Type
        </label>
        <Select
          value={formData.storeType || ''}
          onValueChange={(value) => onChange('storeType', value as StoreFormData['storeType'])}
        >
          <SelectTrigger id="store-type">
            <SelectValue placeholder="Type" />
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

      <div className="space-y-2">
        <TextArea
          label="Description"
          aria-label="Description"
          value={formData.description ?? ''}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="What you sell"
          rows={6}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground">{length} / 1000</p>
      </div>
    </section>
  )
}
