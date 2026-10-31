import type { StoreFormData } from '@api/types'
import { buildSummaryRows } from './storeSummaryModel'
import type { StoreTab } from './storeTabs'

interface StoreSummaryProps {
  readonly formData: StoreFormData
  readonly pendingCount: number
  readonly onOpen: (tab: StoreTab) => void
}

export function StoreSummary({ formData, pendingCount, onOpen }: StoreSummaryProps) {
  const rows = buildSummaryRows(formData, pendingCount)

  return (
    <table className="w-full text-left text-sm">
      <tbody>
        {rows.map((row) => (
          <tr key={row.tab} className="border-b border-border">
            <th scope="row" className="w-36 py-4 pr-6 font-medium text-foreground">
              <button type="button" className="text-left" onClick={() => onOpen(row.tab)}>
                {row.label}
              </button>
            </th>
            <td className="py-4 text-muted-foreground">{row.detail}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
