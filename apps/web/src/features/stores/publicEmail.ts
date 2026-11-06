/**
 * The storefront business email is shown to shoppers only after the vendor confirms it. The server
 * enforces this; these helpers keep the vendor's own views (storefront preview, settings) in step.
 */

/** Same normalization as the server and the form's input mask. */
export function normalizeEmail(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/[^a-z0-9@._%+-]/g, '')
}

/**
 * The email a storefront may display. Public responses already blank an unconfirmed one; a full
 * record (the vendor's own view) carries `publicEmailConfirmedAt`, which decides it here.
 */
export function publicStoreEmail(store: { readonly email?: string | null; readonly publicEmailConfirmedAt?: string | null }): string | null {
  const email = store.email?.trim() || null
  if (!email) return null
  if ('publicEmailConfirmedAt' in store) return store.publicEmailConfirmedAt ? email : null
  return email
}

export type PublicEmailFormState = 'none' | 'published' | 'awaiting-confirmation' | 'new'

/** Where the address in the settings form stands, given what was saved. */
export function publicEmailFormState(form: {
  readonly email: string
  readonly publicEmailConfirmed: boolean
  readonly publicEmailSaved: string
}): PublicEmailFormState {
  const typed = normalizeEmail(form.email)
  if (!typed) return 'none'
  if (typed !== normalizeEmail(form.publicEmailSaved)) return 'new'
  return form.publicEmailConfirmed ? 'published' : 'awaiting-confirmation'
}
