import { Button } from '@shared/ui/primitives'

export type CityOption = {
  readonly id: string
  readonly name: string
  readonly state: string | null
  readonly postalCodes: readonly string[]
}

export type NeighborhoodFormValue = {
  name: string
  parentId: string
  postalCodes: string[]
  headline: string
  about: string
  imageUrls: string
  published: boolean
}

const fieldClass = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm'

export function emptyNeighborhood(parentId: string): NeighborhoodFormValue {
  return { name: '', parentId, postalCodes: [], headline: '', about: '', imageUrls: '', published: false }
}

export function NeighborhoodForm({
  cities,
  value,
  saving,
  error,
  onChange,
  onSubmit,
  onCancel,
}: {
  readonly cities: readonly CityOption[]
  readonly value: NeighborhoodFormValue
  readonly saving: boolean
  readonly error?: string
  readonly onChange: (value: NeighborhoodFormValue) => void
  readonly onSubmit: () => void
  readonly onCancel: () => void
}) {
  const city = cities.find((entry) => entry.id === value.parentId)
  const zips = city?.postalCodes ?? []

  const toggleZip = (code: string) => {
    const postalCodes = value.postalCodes.includes(code)
      ? value.postalCodes.filter((zip) => zip !== code)
      : [...value.postalCodes, code]
    onChange({ ...value, postalCodes })
  }

  return (
    <form
      className="space-y-4 rounded-xl border border-border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Name</span>
          <input className={fieldClass} value={value.name} onChange={(event) => onChange({ ...value, name: event.target.value })} required />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">City</span>
          <select
            className={fieldClass}
            value={value.parentId}
            onChange={(event) => onChange({ ...value, parentId: event.target.value, postalCodes: [] })}
            required
          >
            {cities.map((entry) => (
              <option key={entry.id} value={entry.id}>{entry.name}{entry.state ? `, ${entry.state}` : ''}</option>
            ))}
          </select>
        </label>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Zip codes</legend>
        {zips.length === 0 ? <p className="text-sm text-muted-foreground">This city has no zip codes yet.</p> : null}
        <div className="flex flex-wrap gap-2">
          {zips.map((code) => (
            <label key={code} className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-sm">
              <input type="checkbox" checked={value.postalCodes.includes(code)} onChange={() => toggleZip(code)} />
              {code}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block space-y-1 text-sm">
        <span className="font-medium">Headline</span>
        <input className={fieldClass} maxLength={160} value={value.headline} onChange={(event) => onChange({ ...value, headline: event.target.value })} />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="font-medium">About</span>
        <textarea className={fieldClass} rows={4} value={value.about} onChange={(event) => onChange({ ...value, about: event.target.value })} />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="font-medium">Image URLs</span>
        <textarea className={fieldClass} rows={3} placeholder="One image URL per line. The first is the cover." value={value.imageUrls} onChange={(event) => onChange({ ...value, imageUrls: event.target.value })} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={value.published} onChange={(event) => onChange({ ...value, published: event.target.checked })} />
        Published
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="small" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="small" disabled={saving || value.postalCodes.length === 0}>{saving ? 'Saving…' : 'Save neighborhood'}</Button>
      </div>
    </form>
  )
}
