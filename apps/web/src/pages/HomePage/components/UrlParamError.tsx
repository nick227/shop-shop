/**
 * UrlParamError - Component for displaying URL parameter errors;
 */
import React from 'react'

interface UrlParamErrorProps {
  error: string | null;
  onDismiss: () => void;
}

export function UrlParamError({ error, onDismiss }: UrlParamErrorProps) {
  if (!error) return null;
  return (
    <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2" role="alert" aria-live="assertive">
      <span className="text-xl">⚠️</span>
      <div>
        <p className="font-semibold">Invalid URL</p>
        <p className="text-sm">{error}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-auto text-red-600 hover:text-red-800 font-bold text-xl"
        aria-label="Dismiss error"
      >
        ×
      </button>
    </div>
  )
}

