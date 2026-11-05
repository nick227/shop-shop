/**
 * SectionPicker - choose which of the store's menu sections an item is listed under, or make a new one
 * without leaving the item.
 */
import { useEffect, useId, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@shared/ui/primitives'
import { Input } from '@shared/ui/primitives/ui/Input/Input'
import { MAX_SECTION_NAME, normalizeSectionName, sameSectionName, type MenuSection } from '@shared/lib/menu/menuSections'

const NONE = ''

export interface SectionPickerProps {
  readonly sections: readonly MenuSection[]
  readonly value: string
  readonly onChange: (sectionId: string) => void
  /** Creates the section and resolves with its id. */
  readonly onCreate: (name: string) => Promise<string>
}

export function SectionPicker({ sections, value, onChange, onCreate }: SectionPickerProps) {
  const selectId = useId()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const ordered = [...sections].sort((a, b) => a.sortIndex - b.sortIndex)

  // Opening "New section" puts the cursor in the name field.
  useEffect(() => {
    if (adding) nameRef.current?.focus()
  }, [adding])

  const create = async () => {
    const next = normalizeSectionName(name)
    if (!next) return
    // Typing an existing name picks that section instead of failing.
    const existing = ordered.find((section) => sameSectionName(section.name, next))
    if (existing) {
      onChange(existing.id)
      setAdding(false)
      setName('')
      return
    }
    setSaving(true)
    setError('')
    try {
      onChange(await onCreate(next))
      setAdding(false)
      setName('')
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Could not add the section')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <label htmlFor={selectId} className="text-sm font-medium text-foreground">
        Menu section
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value={NONE}>Not in a section</option>
        {ordered.map((section) => (
          <option key={section.id} value={section.id}>
            {section.name}
            {section.isVisible ? '' : ' (hidden)'}
          </option>
        ))}
      </select>

      {adding ? (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Input
              aria-label="New section name"
              placeholder="Like “Breakfast” or “Drinks”"
              value={name}
              maxLength={MAX_SECTION_NAME}
              ref={nameRef}
              disabled={saving}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                // This sits inside the item form; Enter adds the section rather than saving the item.
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void create()
                }
                if (e.key === 'Escape') setAdding(false)
              }}
            />
            <Button type="button" variant="primary" size="small" disabled={!normalizeSectionName(name) || saving} onClick={() => void create()}>
              Add
            </Button>
            <Button type="button" variant="ghost" size="small" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      ) : (
        <Button type="button" variant="link" size="small" className="h-auto px-0" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5" />
          New section
        </Button>
      )}
    </div>
  )
}
