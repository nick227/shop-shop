import { Checkbox, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/primitives'
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

      <Select
        value={formData.storeType || ''}
        onValueChange={(value) => onChange('storeType', value as StoreFormData['storeType'])}
      >
        <SelectTrigger
          id="store-type"
          aria-label="Type"
          className="h-auto w-fit gap-2 border-0 bg-transparent px-0 py-0 text-base text-muted-foreground shadow-none focus:ring-0 focus:ring-offset-0"
        >
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

      <textarea
        aria-label="Description"
        value={formData.description ?? ''}
        onChange={(e) => onChange('description', e.target.value)}
        placeholder="What you sell"
        rows={8}
        maxLength={1000}
        className="w-full resize-none border-0 bg-transparent p-0 text-xl leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-0"
      />
      <p className="text-xs text-muted-foreground">{length} / 1000</p>
    </section>
  )
}
