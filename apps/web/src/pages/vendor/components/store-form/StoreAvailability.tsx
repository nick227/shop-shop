import { cn } from '@shared/lib/cn'

const OPTIONS = [
  {
    enabled: true,
    title: 'Enabled',
    detail: 'Customers can find this store and place orders.',
  },
  {
    enabled: false,
    title: 'Disabled',
    detail: 'Hidden from customers. They cannot find it or place orders.',
  },
] as const

interface StoreAvailabilityProps {
  readonly enabled: boolean
  readonly storeUrl: string
  readonly onChange: (enabled: boolean) => void
}

export function StoreAvailability({ enabled, storeUrl, onChange }: StoreAvailabilityProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-base font-medium text-foreground">Availability</legend>
      <div className="grid gap-3 md:grid-cols-2">
        {OPTIONS.map((option) => {
          const checked = enabled === option.enabled
          return (
            <label
              key={option.title}
              className={cn(
                'flex cursor-pointer flex-col gap-1 rounded-md border p-4',
                checked ? 'border-foreground' : 'border-border',
              )}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="store-availability"
                  className="h-4 w-4"
                  checked={checked}
                  onChange={() => onChange(option.enabled)}
                />
                <span className="text-sm font-medium">{option.title}</span>
              </span>
              <span className="text-sm text-muted-foreground">{option.detail}</span>
            </label>
          )
        })}
      </div>
      {storeUrl ? (
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          {storeUrl}
        </a>
      ) : null}
    </fieldset>
  )
}
