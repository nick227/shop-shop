import type { ReactNode } from 'react'
import { PageShell } from '@shared/ui/layout/PageShell'

export function LegalShell(props: { readonly title: string; readonly children: ReactNode }) {
  return (
    <PageShell className="bg-background" containerClassName="max-w-3xl" contentClassName="py-8 md:py-12">
      <article className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{props.title}</h1>
        <div className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert">{props.children}</div>
      </article>
    </PageShell>
  )
}
