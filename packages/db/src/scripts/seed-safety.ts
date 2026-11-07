const DEFAULT_PASSWORD = 'Test123456!'
const MIN_REMOTE_PASSWORD_LENGTH = 16
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/** Password for seeded accounts. Local seeds use the documented default. */
export function seedPassword(): string {
  return process.env.SEED_PASSWORD || DEFAULT_PASSWORD
}

/** Safe to print: a custom password is never written to logs. */
export function seedPasswordForLog(): string {
  return process.env.SEED_PASSWORD ? '(value of SEED_PASSWORD)' : DEFAULT_PASSWORD
}

/**
 * For scripts that rewrite or delete data: a non-local database must be named
 * explicitly in SEED_ALLOW_REMOTE_HOST.
 */
export function assertRemoteConfirmed(env: NodeJS.ProcessEnv = process.env): void {
  const url = env.DATABASE_URL
  if (!url) throw new Error('Refusing to run: DATABASE_URL is not set.')

  const host = new URL(url).hostname
  if (LOCAL_HOSTS.has(host) || env.SEED_ALLOW_REMOTE_HOST === host) return

  throw new Error(
    `Refusing to write to remote database "${host}". Set SEED_ALLOW_REMOTE_HOST=${host} to confirm.`,
  )
}

/**
 * For scripts that also create accounts: a non-local database additionally needs a
 * strong SEED_PASSWORD, so the password documented in this repo never reaches it.
 */
export function assertSeedTargetAllowed(env: NodeJS.ProcessEnv = process.env): void {
  assertRemoteConfirmed(env)

  const host = new URL(env.DATABASE_URL ?? '').hostname
  if (LOCAL_HOSTS.has(host)) return

  const password = env.SEED_PASSWORD ?? ''
  if (password.length < MIN_REMOTE_PASSWORD_LENGTH || password === DEFAULT_PASSWORD) {
    throw new Error(
      `Refusing to seed remote database "${host}": SEED_PASSWORD must be at least ${MIN_REMOTE_PASSWORD_LENGTH} characters and not the default.`,
    )
  }
}
