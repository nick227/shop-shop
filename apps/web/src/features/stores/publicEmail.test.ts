import { describe, expect, it } from 'vitest'
import { publicEmailFormState, publicStoreEmail } from './publicEmail'

describe('storefront email display', () => {
  it('shows a public response’s email, which the server already filtered', () => {
    expect(publicStoreEmail({ email: 'shop@business.test' })).toBe('shop@business.test')
    expect(publicStoreEmail({ email: null })).toBeNull()
  })

  it('hides an unconfirmed email from the vendor’s own full record too', () => {
    expect(publicStoreEmail({ email: 'owner@account.test', publicEmailConfirmedAt: null })).toBeNull()
    expect(publicStoreEmail({ email: 'shop@business.test', publicEmailConfirmedAt: '2026-11-01T00:00:00Z' })).toBe('shop@business.test')
  })

  it('reads a reformatted saved address as the same address', () => {
    expect(publicEmailFormState({ email: 'owner@account.test', publicEmailSaved: 'Owner@Account.test ', publicEmailConfirmed: false })).toBe('awaiting-confirmation')
    expect(publicEmailFormState({ email: 'other@x.test', publicEmailSaved: 'owner@account.test', publicEmailConfirmed: false })).toBe('new')
    expect(publicEmailFormState({ email: '', publicEmailSaved: 'owner@account.test', publicEmailConfirmed: true })).toBe('none')
  })
})
