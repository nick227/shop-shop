import { cn } from '@shared/lib/cn'

const OPTIONS = [
  { enabled: true, title: 'Enabled' },
  { enabled: false, title: 'Disabled' },
] as const

interface StoreAvailabilityProps {
  readonly enabled: boolean
  readonly storeUrl: string
  readonly onChange: (enabled: boolean) => void
}

export function StoreAvailability({ enabled, storeUrl, onChange }: StoreAvailabilityProps) {
  return (
    <div className="space-y-6">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">Accepting orders</legend>
        <div className="inline-flex overflow-hidden rounded-md border border-border">
          {OPTIONS.map((option) => {
            const checked = enabled === option.enabled
            return (
              <label
                key={option.title}
                className={cn(
                  'cursor-pointer px-3 py-1.5 text-sm',
                  checked ? 'bg-foreground text-background' : 'text-muted-foreground',
                )}
              >
                <input
                  type="radio"
                  name="store-availability"
                  className="sr-only"
                  checked={checked}
                  onChange={() => onChange(option.enabled)}
                />
                {option.title}
              </label>
            )
          })}
        </div>
      </fieldset>

      {storeUrl ? (
        <section className="space-y-1 rounded-md border border-border px-4 py-3">
          <h3 className="text-sm font-medium text-foreground">Public URL</h3>
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-base text-foreground underline-offset-4 hover:underline"
          >
            {storeUrl}
          </a>
        </section>
      ) : null}
    </div>
  )
}
