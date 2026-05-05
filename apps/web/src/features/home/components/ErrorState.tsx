/**
 * ErrorState — single recovery action (retry).
 */
import React from 'react'

export interface ErrorStateProps {
  readonly error: Error | undefined
  readonly onRetry: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  if (!error) return

  return (
    <div
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-5 text-center text-red-900 shadow-sm"
      role="alert"
    >
      <h3 className="text-lg font-semibold">Something went wrong</h3>
      <p className="mt-2 text-sm">{error.message}</p>
      <button
        type="button"
        className="mt-4 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-800"
        onClick={() => {
          onRetry()
        }}
      >
        Retry
      </button>
    </div>
  )
}
