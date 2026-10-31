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
        <legend className="text-sm font-medium text-foreground">Public page</legend>
        <div className="flex gap-4">
          {OPTIONS.map((option) => (
            <label key={option.title} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="store-availability"
                className="h-4 w-4"
                checked={enabled === option.enabled}
                onChange={() => onChange(option.enabled)}
              />
              {option.title}
            </label>
          ))}
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
