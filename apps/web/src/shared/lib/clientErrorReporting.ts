/**
 * Central client-side UI error reporting: Sentry (if injected), console, optional HTTP endpoint.
 */
import type { ErrorInfo } from 'react'

export interface UiErrorPayload {
  readonly error: {
    readonly name: string
    readonly message: string
    readonly stack: string | undefined
  }
  readonly errorInfo: {
    readonly componentStack: string | undefined
  }
  readonly context: {
    readonly url: string
    readonly userAgent: string
    readonly timestamp: string
    readonly environment: string
  }
}

interface SentryLike {
  captureException(
    error: Error,
    context?: { extra?: Record<string, unknown>; tags?: Record<string, string> }
  ): string
}

function getWindowSentry(): SentryLike | undefined {
  if (typeof globalThis === 'undefined' || !('window' in globalThis)) return undefined
  const w = globalThis as typeof globalThis & { Sentry?: SentryLike }
  return typeof w.Sentry?.captureException === 'function' ? w.Sentry : undefined
}

function buildPayload(error: Error, errorInfo: ErrorInfo): UiErrorPayload {
  return {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack ?? undefined,
    },
    errorInfo: {
      componentStack: errorInfo.componentStack ?? undefined,
    },
    context: {
      url: typeof globalThis !== 'undefined' && 'location' in globalThis ? globalThis.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE,
    },
  }
}

function postToErrorEndpoint(payload: UiErrorPayload): void {
  const endpoint = import.meta.env.VITE_ERROR_ENDPOINT
  if (!endpoint || import.meta.env.DEV) return
  void fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // ignore transport failures
  })
}

/**
 * Report a React error boundary (or other UI) error. Always records locally; in production
 * also tries Sentry on `window.Sentry` and optional `VITE_ERROR_ENDPOINT`.
 */
export function reportUiError(error: Error, errorInfo: ErrorInfo, source = 'ErrorBoundary'): void {
  const payload = buildPayload(error, errorInfo)

  if (import.meta.env.DEV) {
    console.error(`[${source}]`, error, errorInfo)
    return
  }

  const sentry = getWindowSentry()
  if (sentry) {
    sentry.captureException(error, {
      extra: { payload },
      tags: { component: source, environment: import.meta.env.MODE },
    })
  }

  console.error('[UI Error]', payload)
  postToErrorEndpoint(payload)
}
