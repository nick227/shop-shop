import { cn } from '@shared/lib/cn'
import type { StoreFormData } from '@api/types'
import { buildSummaryRows, requiredProgress, type SummaryRow, type SummaryStatus } from './storeSummaryModel'
import type { StoreTab } from './storeTabs'

interface StoreSummaryProps {
  readonly formData: StoreFormData
  readonly pendingCount: number
  readonly onOpen: (tab: StoreTab) => void
}

const STATUS_LABEL: Record<SummaryStatus, string> = {
  needed: 'Needed',
  ready: 'Ready',
  optional: 'Optional',
}

export function StoreSummary({ formData, pendingCount, onOpen }: StoreSummaryProps) {
  const rows = buildSummaryRows(formData, pendingCount)
  const progress = requiredProgress(rows)
  const required = rows.filter((row) => row.status !== 'optional')
  const optional = rows.filter((row) => row.status === 'optional')

  return (
    <div className="space-y-12">
      <p className="text-lg font-medium text-foreground">{progress.title}</p>

      <div className="grid gap-4 md:grid-cols-3">
        {required.map((row) => (
          <SummaryTile key={row.tab} row={row} onOpen={onOpen} />
        ))}
      </div>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Optional</p>
        <div className="grid gap-8 md:grid-cols-2">
          {optional.map((row) => (
            <button
              key={row.tab}
              type="button"
              onClick={() => onOpen(row.tab)}
              className="space-y-2 py-2 text-left"
            >
              <span className="block text-base font-medium text-foreground">{row.label}</span>
              <span className="block text-sm leading-relaxed text-muted-foreground">{row.detail}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function SummaryTile({ row, onOpen }: { readonly row: SummaryRow; readonly onOpen: (tab: StoreTab) => void }) {
  const needed = row.status === 'needed'

  return (
    <button
      type="button"
      onClick={() => onOpen(row.tab)}
      className={cn(
        'flex min-h-44 flex-col items-start gap-4 p-5 text-left',
        needed ? 'bg-amber-500/10' : 'bg-muted/60',
      )}
    >
      <span className="text-sm text-muted-foreground">{row.label}</span>
      <span className={cn('text-2xl font-medium tracking-tight', needed ? 'text-amber-800 dark:text-amber-300' : 'text-foreground')}>
        {STATUS_LABEL[row.status]}
      </span>
      <span className="text-sm leading-relaxed text-foreground/80">{row.detail}</span>
    </button>
  )
}
