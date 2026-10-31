import { cn } from '@shared/lib/cn'
import type { StoreFormData } from '@api/types'
import { buildSummaryRows, requiredProgress, type SummaryStatus } from './storeSummaryModel'
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
  const percent = progress.total === 0 ? 0 : Math.round((progress.ready / progress.total) * 100)

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-6">
          <p className="text-lg font-medium text-foreground">{progress.title}</p>
          <p className="shrink-0 text-sm text-muted-foreground">
            {progress.ready} of {progress.total}
          </p>
        </div>
        <Meter label="Required sections" done={progress.ready} total={progress.total} percent={percent} tone="ready" />
      </div>

      <div className="divide-y divide-border">
        {rows.map((row) => {
          const rowPercent = row.total === 0 ? 0 : Math.round((row.done / row.total) * 100)
          return (
            <button
              key={row.tab}
              type="button"
              onClick={() => onOpen(row.tab)}
              className={cn(
                'grid w-full gap-4 border-l-2 py-6 pl-5 text-left transition-colors hover:bg-muted/40 md:grid-cols-[minmax(0,1fr)_4.5rem] md:items-start',
                row.status === 'needed' && 'border-amber-500',
                row.status === 'ready' && 'border-foreground',
                row.status === 'optional' && 'border-border',
              )}
            >
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-base font-medium text-foreground">{row.label}</span>
                  <span className={cn('text-sm', statusTone(row.status))}>{STATUS_LABEL[row.status]}</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{row.detail}</p>
                <Meter label={`${row.label} progress`} done={row.done} total={row.total} percent={rowPercent} tone={row.status} />
              </div>
              <span className="text-sm text-muted-foreground md:text-right">
                {row.done} / {row.total}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Meter({
  label,
  done,
  total,
  percent,
  tone,
}: {
  readonly label: string
  readonly done: number
  readonly total: number
  readonly percent: number
  readonly tone: SummaryStatus
}) {
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      className="h-1.5 w-full max-w-md overflow-hidden bg-muted"
    >
      <div
        className={cn(
          'h-full',
          tone === 'needed' && 'bg-amber-500',
          tone === 'ready' && 'bg-foreground',
          tone === 'optional' && 'bg-muted-foreground/50',
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

function statusTone(status: SummaryStatus): string {
  if (status === 'needed') return 'text-amber-700 dark:text-amber-400'
  if (status === 'ready') return 'text-foreground'
  return 'text-muted-foreground'
}
