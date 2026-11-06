import { Button } from '@shared/ui/primitives'
import { SUGGESTED_TAGS, tagFilterKey } from '@features/home/discovery/heroTags'

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
  videoUrls: string
  published: boolean
  tags: NeighborhoodTagDraft[]
}

export type NeighborhoodTagDraft = {
  label: string
  kind: 'EDITORIAL' | 'DISCOVERY'
  categoryId: string
  searchQuery: string
  visible: boolean
}

const TAG_CATEGORIES = [
  { id: 'food', label: 'Food' },
  { id: 'grocery', label: 'Grocery' },
  { id: 'convenience', label: 'Convenience' },
  { id: 'retail', label: 'Retail' },
  { id: 'arts', label: 'Arts' },
  { id: 'outdoors', label: 'Outdoors' },
] as const

const fieldClass = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm'

export function emptyNeighborhood(parentId: string): NeighborhoodFormValue {
  return { name: '', parentId, postalCodes: [], headline: '', about: '', imageUrls: '', videoUrls: '', published: false, tags: [] }
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
      <label className="block space-y-1 text-sm">
        <span className="font-medium">Video URLs</span>
        <textarea className={fieldClass} rows={2} placeholder="One video URL per line." value={value.videoUrls} onChange={(event) => onChange({ ...value, videoUrls: event.target.value })} />
      </label>
      <TagEditor tags={value.tags} onChange={(tags) => onChange({ ...value, tags })} />
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

/**
 * Pinned tags show first in the hero, in this order. Discovery tags need a category or search,
 * and show a live count. Editorial tags without a query are shown as plain labels.
 * Suggestions are added automatically when they have results; hide one to turn it off here.
 */
function TagEditor({ tags, onChange }: { readonly tags: readonly NeighborhoodTagDraft[]; readonly onChange: (tags: NeighborhoodTagDraft[]) => void }) {
  const update = (index: number, patch: Partial<NeighborhoodTagDraft>) => onChange(tags.map((tag, at) => (at === index ? { ...tag, ...patch } : tag)))
  const move = (index: number, by: number) => {
    const next = [...tags]
    const [tag] = next.splice(index, 1)
    if (tag) next.splice(index + by, 0, tag)
    onChange(next)
  }
  const pinned = new Set(tags.map((tag) => tagFilterKey(tag.categoryId, tag.searchQuery)))
  const unpinned = SUGGESTED_TAGS.filter((tag) => !pinned.has(tagFilterKey(tag.categoryId, tag.searchQuery)))
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Hero tags</legend>
      <p className="text-xs text-muted-foreground">
        Up to six show in the hero: these first, then suggestions with the most results. Discovery tags need a category or search, and are hidden when they have no results.
      </p>
      {tags.map((tag, index) => {
        const needsQuery = tag.kind === 'DISCOVERY' && !tag.categoryId && !tag.searchQuery.trim()
        return (
          <div key={index} className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2">
            <input className={`${fieldClass} !w-40`} aria-label="Tag label" maxLength={60} value={tag.label} onChange={(event) => update(index, { label: event.target.value })} required />
            <select className={`${fieldClass} !w-32`} aria-label="Tag kind" value={tag.kind} onChange={(event) => update(index, { kind: event.target.value as NeighborhoodTagDraft['kind'] })}>
              <option value="DISCOVERY">Discovery</option>
              <option value="EDITORIAL">Editorial</option>
            </select>
            <select className={`${fieldClass} !w-36`} aria-label="Tag category" value={tag.categoryId} onChange={(event) => update(index, { categoryId: event.target.value })}>
              <option value="">No category</option>
              {TAG_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
            </select>
            <input className={`${fieldClass} !w-36`} aria-label="Tag search" placeholder="Search (optional)" maxLength={80} value={tag.searchQuery} onChange={(event) => update(index, { searchQuery: event.target.value })} />
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={tag.visible} onChange={(event) => update(index, { visible: event.target.checked })} />
              Visible
            </label>
            <div className="ml-auto flex gap-1">
              <Button type="button" variant="outline" size="small" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move ${tag.label || 'tag'} up`}>↑</Button>
              <Button type="button" variant="outline" size="small" disabled={index === tags.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${tag.label || 'tag'} down`}>↓</Button>
              <Button type="button" variant="outline" size="small" onClick={() => onChange(tags.filter((_, at) => at !== index))}>Remove</Button>
            </div>
            {needsQuery ? <p className="w-full text-xs text-destructive">Choose a category or enter a search, or make it editorial.</p> : null}
          </div>
        )
      })}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="small" disabled={tags.length >= 12} onClick={() => onChange([...tags, { label: '', kind: 'EDITORIAL', categoryId: '', searchQuery: '', visible: true }])}>
          Add tag
        </Button>
        {unpinned.length > 0 ? <span className="text-xs text-muted-foreground">Pin a suggestion:</span> : null}
        {unpinned.map((tag) => (
          <button
            key={tag.label}
            type="button"
            className="rounded-full border border-border px-2 py-0.5 text-xs"
            disabled={tags.length >= 12}
            onClick={() => onChange([...tags, { label: tag.label, kind: 'DISCOVERY', categoryId: tag.categoryId, searchQuery: tag.searchQuery ?? '', visible: true }])}
          >
            + {tag.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
