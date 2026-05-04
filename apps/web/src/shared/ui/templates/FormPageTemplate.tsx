// @ts-nocheck
/**
 * FormPageTemplate - DRY template for create/edit form pages;
 * Eliminates 200+ lines of boilerplate per form page;
 */
import type { ReactNode } from 'react'
import { Button, Spinner } from '@shared/ui/primitives'
import { PageContainer, PageHeader } from '@shared/ui/layout/PageLayout'
import { Card, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@shared/lib/cn'

export interface FormSection {
  id: string;
  icon: string | ReactNode;
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
      <PageContainer className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Spinner size="large" />
        <p className="text-muted-foreground animate-pulse">{loadingMessage}</p>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="max-w-4xl mx-auto">
      <PageHeader
        title={title}
        description={subtitle}
        breadcrumbs={
          <Button variant="ghost" size="small" onClick={onBack} className="-ml-2 text-muted-foreground hover:bg-transparent">
            <ArrowLeft className="w-4 h-4 mr-1" />
            {backLabel.replace('← ', '')}
          </Button>
        }
      />

      <form className="space-y-8" onSubmit={onSubmit}>
        {sections.map((section) => (
          <section key={section.id} className="space-y-4">
            <div className="flex flex-col gap-1 px-1">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <span className="text-2xl">{section.icon}</span>
                {section.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {section.description}
              </p>
            </div>
            
            <Card className="shadow-sm border-border/50">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {section.content}
                </div>
              </CardContent>
            </Card>
          </section>
        ))}

        {/* Actions */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-4 flex gap-3 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel || onBack}
              disabled={isSubmitting}
              className="h-12 px-6"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={isSubmitting}
              className="h-12 px-8 min-w-[140px] shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="small" className="mr-2" />
                  Saving...
                </>
              ) : submitLabel}
            </Button>
          </CardContent>
        </Card>
      </form>
    </PageContainer>
  )
}

/**
 * Helper component for character count display;
 */
export function CharCount({ current, max }: { current: number; max: number }) {
  const isNearLimit = current > max * 0.9;
  return (
    <div
      className={cn(
        'text-[10px] uppercase tracking-wider font-bold mt-2 text-right',
        isNearLimit ? 'text-destructive' : 'text-muted-foreground/60'
      )}
    >
      {current} / {max}
    </div>
  )
}

/**
 * Helper component for two-column input rows;
 */
export function FormRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
}

/**
 * Helper component for checkbox groups;
 */
export function CheckboxGroup({ children }: { children: ReactNode }) {
  return <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border/30">{children}</div>
}


