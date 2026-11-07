import { describe, expect, it } from 'vitest'
import { assertRemoteConfirmed, assertSeedTargetAllowed } from './seed-safety.js'

const REMOTE = 'mysql://u:p@db.example.com:3306/app'
const STRONG = 'a-long-random-password'

describe('assertSeedTargetAllowed', () => {
  it('allows local databases without extra settings', () => {
    expect(() => assertSeedTargetAllowed({ DATABASE_URL: 'mysql://u:p@localhost:3306/app' })).not.toThrow()
    expect(() => assertSeedTargetAllowed({ DATABASE_URL: 'mysql://u:p@127.0.0.1:3306/app' })).not.toThrow()
  })

  it('refuses when DATABASE_URL is missing', () => {
    expect(() => assertSeedTargetAllowed({})).toThrow(/not set/)
  })

  it('refuses a remote database that is not named', () => {
    expect(() => assertSeedTargetAllowed({ DATABASE_URL: REMOTE, SEED_PASSWORD: STRONG })).toThrow(/SEED_ALLOW_REMOTE_HOST/)
    expect(() =>
      assertSeedTargetAllowed({ DATABASE_URL: REMOTE, SEED_ALLOW_REMOTE_HOST: 'other.example.com', SEED_PASSWORD: STRONG }),
    ).toThrow(/SEED_ALLOW_REMOTE_HOST/)
  })

  it('refuses a remote database without a strong password', () => {
    const base = { DATABASE_URL: REMOTE, SEED_ALLOW_REMOTE_HOST: 'db.example.com' }
    expect(() => assertSeedTargetAllowed(base)).toThrow(/SEED_PASSWORD/)
    expect(() => assertSeedTargetAllowed({ ...base, SEED_PASSWORD: 'Test123456!' })).toThrow(/SEED_PASSWORD/)
  })

  it('allows a named remote database with a strong password', () => {
    expect(() =>
      assertSeedTargetAllowed({ DATABASE_URL: REMOTE, SEED_ALLOW_REMOTE_HOST: 'db.example.com', SEED_PASSWORD: STRONG }),
    ).not.toThrow()
  })
})

describe('assertRemoteConfirmed', () => {
  it('allows local databases', () => {
    expect(() => assertRemoteConfirmed({ DATABASE_URL: 'mysql://u:p@localhost:3306/app' })).not.toThrow()
  })

  it('refuses when DATABASE_URL is missing', () => {
    expect(() => assertRemoteConfirmed({})).toThrow(/not set/)
  })

  it('requires the remote host to be named, without needing a password', () => {
    expect(() => assertRemoteConfirmed({ DATABASE_URL: REMOTE })).toThrow(/SEED_ALLOW_REMOTE_HOST/)
    expect(() => assertRemoteConfirmed({ DATABASE_URL: REMOTE, SEED_ALLOW_REMOTE_HOST: 'db.example.com' })).not.toThrow()
  })
})
