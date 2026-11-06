import { useEffect, useState } from 'react'
import { Input } from '@shared/ui/primitives'
import { FormRow } from '@shared/ui/templates'
import { maskEmailInput, maskUsPhoneInput } from '@shared/lib/utils/fieldInputMasks'
import { hasText, type StoreFieldProps } from './storeFieldProps'
import { StoreSectionTitle } from './StoreSectionTitle'
import { publicEmailFormState } from '@features/stores/publicEmail'
import { STORE_LINKS, type StoreLinkField } from './storeLinks'

export function StoreContactSection({ formData, onChange }: StoreFieldProps) {
  return (
    <section className="space-y-6">
          <FormRow>
            <Input
              label="Company"
              value={formData.companyName}
              onChange={(e) => onChange('companyName', e.target.value)}
              placeholder="ACME Corporation"
            />
            <Input
              label="Phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={formData.phone}
              onChange={(e) => onChange('phone', maskUsPhoneInput(e.target.value))}
              placeholder="+1 (555) 123-4567"
            />
          </FormRow>

          <FormRow>
            <PublicEmailField formData={formData} onChange={onChange} />
            <Input
              label="Website"
              type="url"
              value={formData.website}
              onChange={(e) => onChange('website', e.target.value)}
              placeholder="https://www.store.com"
            />
          </FormRow>

          <div className="space-y-6">
            <StoreSectionTitle>Links</StoreSectionTitle>
            <StoreLinks formData={formData} onChange={onChange} />
          </div>
    </section>
  )
}

function StoreLinks({ formData, onChange }: StoreFieldProps) {
  const [shown, setShown] = useState<StoreLinkField[]>([])

  useEffect(() => {
    const filled = STORE_LINKS.filter((link) => hasText(formData[link.field])).map((link) => link.field)
    if (filled.length === 0) return
    setShown((current) => {
      const merged = [...current]
      for (const field of filled) {
        if (!merged.includes(field)) merged.push(field)
      }
      return merged.length === current.length ? current : merged
    })
  }, [formData])

  const visible = STORE_LINKS.filter((link) => shown.includes(link.field))
  const hidden = STORE_LINKS.filter((link) => !shown.includes(link.field))

  return (
    <div className="space-y-6">
      {visible.length > 0 && (
        <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
          {visible.map((link) => (
            <div key={link.field} className="space-y-2">
              <Input
                label={link.label}
                value={String(formData[link.field] ?? '')}
                onChange={(e) => onChange(link.field, e.target.value)}
                placeholder={link.placeholder}
              />
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  onChange(link.field, '')
                  setShown((current) => current.filter((field) => field !== link.field))
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {hidden.length > 0 && (
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          value=""
          aria-label="Add a link"
          onChange={(e) => {
            const field = STORE_LINKS.find((link) => link.field === e.target.value)?.field
            if (!field) return
            setShown((current) => (current.includes(field) ? current : [...current, field]))
          }}
        >
          <option value="">Add a link</option>
          {hidden.map((link) => (
            <option key={link.field} value={link.field}>
              {link.label}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

/**
 * The storefront business email. Optional, never filled from the account, and shown to shoppers
 * only once confirmed: typing an address confirms it; an address saved before confirmation existed
 * waits here until the vendor confirms, replaces, or removes it. Changes apply when the form saves.
 */
function PublicEmailField({ formData, onChange }: StoreFieldProps) {
  const state = publicEmailFormState(formData)
  return (
    <div className="space-y-2">
      <Input
        label="Public business email"
        helperText="Displayed to shoppers on your storefront."
        type="email"
        inputMode="email"
        autoComplete="off"
        value={formData.email}
        onChange={(e) => onChange('email', maskEmailInput(e.target.value))}
        placeholder="contact@store.com"
      />
      {state === 'awaiting-confirmation' ? (
        <div role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          <p>This email is saved but not shown to shoppers. Confirm it to display it on your storefront, change it above, or remove it.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 dark:bg-amber-100 dark:text-amber-950"
              onClick={() => onChange('publicEmailConfirmed', true)}
            >
              Show on storefront
            </button>
            <button
              type="button"
              className="rounded-md border border-amber-400 px-3 py-1.5 text-xs font-semibold hover:bg-amber-100 dark:border-amber-600 dark:hover:bg-amber-900"
              onClick={() => onChange('email', '')}
            >
              Remove email
            </button>
          </div>
        </div>
      ) : null}
      {state === 'published' ? <p className="text-xs text-muted-foreground" data-email-state="published">Shown on your storefront.</p> : null}
      {state === 'new' ? <p className="text-xs text-muted-foreground" data-email-state="new">Will show on your storefront when you save.</p> : null}
    </div>
  )
}
