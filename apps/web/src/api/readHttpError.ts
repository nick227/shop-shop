/**
 * Parse JSON error bodies from failed fetch/HTTP responses.
 */

export interface ParsedHttpError {
  readonly message: string
  readonly body?: Record<string, unknown>
}

export async function readHttpErrorFromResponse(response: Response): Promise<ParsedHttpError> {
  let body: Record<string, unknown> | undefined
  try {
    const text = await response.text()
    if (text) {
      const parsed: unknown = JSON.parse(text)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        body = parsed as Record<string, unknown>
      }
    }
  } catch {
    // non-JSON body
  }

  let rawMessage = ''
  if (body && typeof body.message === 'string' && body.message.trim() !== '') {
    rawMessage = body.message.trim()
  } else if (
    body &&
    typeof body.error === 'string' &&
    typeof body.message === 'string'
  ) {
    rawMessage = `${body.error}: ${body.message}`.trim()
  } else if (body && typeof body.error === 'string') {
    rawMessage = body.error
  } else {
    const statusText = (response.statusText || '').trim()
    rawMessage = statusText.length > 0 ? statusText : 'Request failed'
  }

  return { message: rawMessage, body }
}

/** Collapse long server messages (e.g. Prisma traces) for primary UI copy. */
export function summarizeApiErrorMessage(raw: string, maxLen = 280): string {
  const firstLine = raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .find((s) => s.length > 0)
  const base = firstLine ?? raw
  if (base.length <= maxLen) return base
  return `${base.slice(0, maxLen)}…`
}

/** Primary message + optional request id line for API failures in UI. */
export function formatUserFacingApiError(
  error: Error,
  details: Record<string, unknown> | undefined,
): { message: string; hint?: string } {
  const requestId = typeof details?.requestId === 'string' ? details.requestId : undefined
  const summary = summarizeApiErrorMessage(error.message)
  const hint =
    import.meta.env.DEV && requestId ? `Request ID: ${requestId}` : (requestId ? `Reference: ${requestId}` : undefined)
  return { message: summary, hint }
}
