/**
 * Consent for the storefront business email.
 *
 * The email is shown to shoppers only when `publicEmailConfirmedAt` is set. Consent comes from the
 * vendor acting on that field, never from where the address came from:
 *
 * - Typing an address (on create, or replacing the stored one) confirms it: the field is labeled as
 *   public, so entering it there is the vendor publishing it.
 * - Re-saving the form with the address untouched changes nothing. A legacy address stays private
 *   until the vendor confirms it (`publicEmailConfirmed: true`) or replaces it.
 * - Clearing the address, or `publicEmailConfirmed: false`, unpublishes it.
 *
 * A difference from the owner's account email is not consent; nothing here looks at the account.
 */

export interface PublicEmailState {
  readonly email: string | null
  readonly publicEmailConfirmedAt: Date | null
}

/** Same normalization the vendor form applies, so a reformatted load is not mistaken for a new address. */
export function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase().replace(/[^a-z0-9@._%+-]/g, '') : ''
}

/**
 * Returns `data` with `email` and `publicEmailConfirmedAt` settled, and the write-only
 * `publicEmailConfirmed` flag removed. A client can never set `publicEmailConfirmedAt` directly.
 * `current` is null on create.
 */
export function applyPublicEmailConsent<T extends Record<string, unknown>>(
  data: T,
  current: PublicEmailState | null,
  now: Date = new Date(),
): Record<string, unknown> {
  const { publicEmailConfirmed, publicEmailConfirmedAt: _ignored, ...rest } = data as T & {
    publicEmailConfirmed?: unknown
    publicEmailConfirmedAt?: unknown
  }
  const next: Record<string, unknown> = { ...rest }
  const emailSent = 'email' in data
  const sentEmail = typeof data.email === 'string' ? data.email.trim() : ''

  if (current === null) {
    next.email = sentEmail || null
    next.publicEmailConfirmedAt = sentEmail && publicEmailConfirmed !== false ? now : null
    return next
  }

  if (emailSent) {
    if (!sentEmail) {
      next.email = null
      next.publicEmailConfirmedAt = null
      return next
    }
    next.email = sentEmail
    if (normalizeEmail(sentEmail) !== normalizeEmail(current.email)) {
      next.publicEmailConfirmedAt = publicEmailConfirmed === false ? null : now
      return next
    }
  }

  const stored = emailSent ? sentEmail : current.email
  if (publicEmailConfirmed === true && normalizeEmail(stored)) {
    next.publicEmailConfirmedAt = current.publicEmailConfirmedAt ?? now
  } else if (publicEmailConfirmed === false) {
    next.publicEmailConfirmedAt = null
  }
  return next
}

/** The email shoppers may see, or null. */
export function publishedEmail(store: { readonly email?: unknown; readonly publicEmailConfirmedAt?: unknown }): string | null {
  if (!store.publicEmailConfirmedAt) return null
  return typeof store.email === 'string' && store.email.trim() ? store.email : null
}
