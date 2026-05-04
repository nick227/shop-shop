/**
 * Central client-side UI error reporting: Sentry (if injected), console, optional HTTP endpoint.
 */
import type { ErrorInfo } from 'react'
import { getLastApiRequestId } from '@api/client'
import { useAuthStore } from '@stores/authStore'

/** Structured report for logs and `VITE_ERROR_ENDPOINT` (context, not only the error string). */
export interface UiErrorReport {
  readonly message: string
  readonly stack: string | undefined
  readonly route: string
  readonly userId: string | undefined
  readonly requestId: string | undefined
  readonly name: string
  readonly componentStack: string | undefined
  readonly url: string
  readonly timestamp: string
  readonly environment: string
  readonly userAgent: string
  readonly source: string
}

function getRouteAndUrl(): { route: string; url: string } {
  if (typeof globalThis === 'undefined' || !('location' in globalThis)) {
    return { route: '', url: '' }
  }
  const loc = globalThis.location
  return {
    route: `${loc.pathname}${loc.search ?? ''}`,
    url: loc.href,
  }
}

function readAuthUserId(): string | undefined {
  const user = useAuthStore.getState().user as { id?: string } | undefined
  return typeof user?.id === 'string' ? user.id : undefined
}

function buildUiErrorReport(error: Error, errorInfo: ErrorInfo, source: string): UiErrorReport {
  const { route, url } = getRouteAndUrl()

  return {
    message: error.message,
    stack: error.stack ?? undefined,
    route,
    userId: readAuthUserId(),
    requestId: getLastApiRequestId(),
    name: error.name,
    componentStack: errorInfo.componentStack ?? undefined,
    url,
    timestamp: new Date().toISOString(),
    environment: import.meta.env.MODE,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    source,
  }
}

function postToErrorEndpoint(report: UiErrorReport): void {
  const endpoint = import.meta.env.VITE_ERROR_ENDPOINT
  if (!endpoint || import.meta.env.DEV) return
  void fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  }).catch(() => {
    // ignore transport failures
  })
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

/**
 * Report a React error boundary (or other UI) error. Always records locally; in production
 * also tries Sentry on `window.Sentry` and optional `VITE_ERROR_ENDPOINT`.
 */
export function reportUiError(error: Error, errorInfo: ErrorInfo, source = 'ErrorBoundary'): void {
  const report = buildUiErrorReport(error, errorInfo, source)

  if (import.meta.env.DEV) {
    console.error(`[${source}]`, report, error, errorInfo)
    return
  }

  const sentry = getWindowSentry()
  if (sentry) {
    sentry.captureException(error, {
      extra: { report },
      tags: { component: source, environment: import.meta.env.MODE },
    })
  }

  console.error('[UI Error]', report)
  postToErrorEndpoint(report)
}
