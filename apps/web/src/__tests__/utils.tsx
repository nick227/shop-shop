/**
 * Test Utilities - Helpers for testing React components;
 */
import type { ReactElement } from 'react'
import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react'
import { AllProviders } from './providers'

/**
 * Custom render with providers;
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): ReturnType<typeof render> {
  return render(ui, { wrapper: AllProviders, ...options })
}

// Re-export everything from Testing Library;
export * from '@testing-library/react'
export { userEvent } from '@testing-library/user-event'

