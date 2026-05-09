import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Spinner } from '@shared/ui/primitives'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'

export interface AdminTableColumn {
  label: string
  className?: string
}

interface AdminTableProps<T> {
  columns: AdminTableColumn[]
  rows: T[]
  renderRow: (row: T) => ReactNode
  isLoading?: boolean
  emptyIcon?: LucideIcon | ReactNode
  emptyTitle?: string
  emptyDescription?: string
}

export function AdminTable<T>({
  columns,
  rows,
  renderRow,
  isLoading,
  emptyIcon,
  emptyTitle = 'No results',
  emptyDescription,
}: AdminTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Spinner size="large" />
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
            {columns.map((col) => (
              <th key={col.label} className={col.className ?? 'px-4 py-3'}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-muted/30 transition-colors">
              {renderRow(row)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
