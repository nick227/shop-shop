/**
 * FormPageTemplate - DRY template for create/edit form pages;
 * Eliminates 200+ lines of boilerplate per form page;
 */
import type { ReactNode } from 'react'
import { Button, Spinner } from '@shared/ui/primitives'

export interface FormSection {
  id: string;
  icon: string;
  title: string;
  description: string;
  content: ReactNode;
}

export interface FormPageTemplateProps {
  /** Page title (e.g., "Edit Store" or "Create Item") */
  title: string;
  /** Optional subtitle displayed under title */
  subtitle?: string;
  /** Back button label */
  backLabel: string;
  /** Back button onClick handler */
  onBack: () => void;
  /** Form sections array */
  sections: FormSection[]
  /** Form submit handler */
  onSubmit: (e: React.FormEvent) => void;
  /** Cancel button onClick handler (defaults to onBack) */
  onCancel?: () => void;
  /** Submit button label (e.g., "Create" or "Update") */
  submitLabel: string;
  /** Whether form is currently submitting */
  isSubmitting: boolean;
  /** Loading state for fetching existing data */
  isLoading?: boolean;
  /** Loading message (defaults to "Loading...") */
  loadingMessage?: string;
}

export function FormPageTemplate({
  title,
  subtitle,
  backLabel,
  onBack,
  sections,
  onSubmit,
  onCancel,
  submitLabel,
  isSubmitting,
  isLoading = false,
  loadingMessage = 'Loading...'}: FormPageTemplateProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Spinner size="large" />
        <p className="text-gray-600">{loadingMessage}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-base text-gray-600 mt-1">{subtitle}</p>}
          </div>
          <Button variant="ghost" onClick={onBack}>
            {backLabel}
          </Button>
        </div>
      </div>

      {/* Form */}
      <form className="max-w-4xl mx-auto px-4 py-8" onSubmit={onSubmit}>
        {sections.map((section) => (
          <section
            key={section.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {section.icon} {section.title}
            </h2>
            <p className="text-sm text-gray-600 mb-6">{section.description}</p>
            <div className="space-y-4">{section.content}</div>
          </section>
        ))}

        {/* Actions */}
        <div className="flex gap-3 justify-end mt-8">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel || onBack}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  )
}

/**
 * Helper component for character count display;
 */
export function CharCount({ current, max }: { current: number; max: number }) {
  const isNearLimit = current > max * 0.9;
  return (
    <div
      className={'text-xs mt-1 ' + (isNearLimit ? 'text-amber-600 font-medium' : 'text-gray-500')}
    >
      {current}/{max} characters
    </div>
  )
}

/**
 * Helper component for two-column input rows;
 */
export function FormRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
}

/**
 * Helper component for checkbox groups;
 */
export function CheckboxGroup({ children }: { children: ReactNode }) {
  return <div className="space-y-3">{children}</div>
}

