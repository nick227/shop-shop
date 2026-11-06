import { describe, expect, it } from 'vitest'
import { applyPublicEmailConsent, publishedEmail } from './store-public-email.service'

const now = new Date('2026-11-06T12:00:00Z')
const earlier = new Date('2026-10-01T09:00:00Z')

describe('public email consent', () => {
  describe('on create', () => {
    it('publishes an email the vendor typed', () => {
      expect(applyPublicEmailConsent({ email: ' hello@shop.test ' }, null, now)).toMatchObject({ email: 'hello@shop.test', publicEmailConfirmedAt: now })
    })

    it('leaves a blank or missing email unpublished', () => {
      expect(applyPublicEmailConsent({ email: '' }, null, now)).toMatchObject({ email: null, publicEmailConfirmedAt: null })
      expect(applyPublicEmailConsent({ name: 'Shop' }, null, now)).toMatchObject({ email: null, publicEmailConfirmedAt: null })
    })
  })

  describe('on update', () => {
    const legacy = { email: 'Owner@Account.test', publicEmailConfirmedAt: null }

    it('keeps a legacy email private when the form is re-saved untouched, even reformatted', () => {
      const next = applyPublicEmailConsent({ email: 'owner@account.test', name: 'Shop' }, legacy, now)
      expect(next).toMatchObject({ email: 'owner@account.test' })
      expect(next).not.toHaveProperty('publicEmailConfirmedAt')
    })

    it('publishes the stored email only on explicit confirmation', () => {
      expect(applyPublicEmailConsent({ publicEmailConfirmed: true }, legacy, now)).toMatchObject({ publicEmailConfirmedAt: now })
      expect(applyPublicEmailConsent({ email: 'Owner@Account.test', publicEmailConfirmed: true }, legacy, now)).toMatchObject({ publicEmailConfirmedAt: now })
    })

    it('keeps the original confirmation time when confirmed again', () => {
      expect(applyPublicEmailConsent({ publicEmailConfirmed: true }, { email: 'a@b.test', publicEmailConfirmedAt: earlier }, now)).toMatchObject({ publicEmailConfirmedAt: earlier })
    })

    it('publishes a replacement address the vendor typed', () => {
      expect(applyPublicEmailConsent({ email: 'shop@new.test' }, legacy, now)).toMatchObject({ email: 'shop@new.test', publicEmailConfirmedAt: now })
    })

    it('clears the email and its confirmation together', () => {
      expect(applyPublicEmailConsent({ email: '  ' }, { email: 'a@b.test', publicEmailConfirmedAt: earlier }, now)).toMatchObject({ email: null, publicEmailConfirmedAt: null })
    })

    it('hides it again on publicEmailConfirmed: false', () => {
      expect(applyPublicEmailConsent({ publicEmailConfirmed: false }, { email: 'a@b.test', publicEmailConfirmedAt: earlier }, now)).toMatchObject({ publicEmailConfirmedAt: null })
    })

    it('cannot confirm an email that is not there', () => {
      expect(applyPublicEmailConsent({ publicEmailConfirmed: true }, { email: null, publicEmailConfirmedAt: null }, now)).not.toHaveProperty('publicEmailConfirmedAt')
    })

    it('never takes the confirmation time from the client, and drops the write-only flag', () => {
      const next = applyPublicEmailConsent({ publicEmailConfirmedAt: '2020-01-01T00:00:00Z', name: 'Shop' }, legacy, now)
      expect(next).not.toHaveProperty('publicEmailConfirmedAt')
      expect(applyPublicEmailConsent({ publicEmailConfirmed: true }, legacy, now)).not.toHaveProperty('publicEmailConfirmed')
    })
  })

  it('shows shoppers only a confirmed, non-blank email', () => {
    expect(publishedEmail({ email: 'a@b.test', publicEmailConfirmedAt: earlier })).toBe('a@b.test')
    expect(publishedEmail({ email: 'a@b.test', publicEmailConfirmedAt: null })).toBeNull()
    expect(publishedEmail({ email: ' ', publicEmailConfirmedAt: earlier })).toBeNull()
  })
})
