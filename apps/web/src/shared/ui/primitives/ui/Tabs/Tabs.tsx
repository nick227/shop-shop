/**
 * Tabs — underline tabs for sections of one thing; SegmentedControl — status filters with counts.
 * Both are controlled; pair them with useSearchParamState to keep the choice in the URL.
 */
import { useRef, type KeyboardEvent } from 'react'
import { cn } from '@shared/lib/cn'

export interface TabItem<T extends string> {
  readonly id: T
  readonly label: string
  readonly count?: number
}

interface ChoiceProps<T extends string> {
  readonly items: readonly TabItem<T>[]
  readonly value: T
  readonly onChange: (value: T) => void
  readonly label: string
  readonly className?: string
}

function useArrowKeys<T extends string>(items: readonly TabItem<T>[], value: T, onChange: (value: T) => void) {
  const listRef = useRef<HTMLDivElement>(null)
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 }
    const step = steps[event.key]
    if (!step) return
    event.preventDefault()
    const index = items.findIndex((item) => item.id === value)
    const next = items[(index + step + items.length) % items.length]
    onChange(next.id)
    listRef.current?.querySelector<HTMLElement>(`[data-id="${next.id}"]`)?.focus()
  }
  return { listRef, onKeyDown }
}

export function Tabs<T extends string>({ items, value, onChange, label, className }: ChoiceProps<T>) {
  const { listRef, onKeyDown } = useArrowKeys(items, value, onChange)
  return (
    <div
      ref={listRef}
      role="tablist"
      tabIndex={-1}
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn('flex gap-6 overflow-x-auto border-b border-border', className)}
    >
      {items.map((item) => {
        const selected = item.id === value
        return (
          <button
            key={item.id}
            data-id={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cn(
              '-mb-px shrink-0 border-b-2 pb-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
            {item.count === undefined ? null : <span className="ml-1.5 tabular-nums text-muted-foreground">{item.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function SegmentedControl<T extends string>({ items, value, onChange, label, className }: ChoiceProps<T>) {
  const { listRef, onKeyDown } = useArrowKeys(items, value, onChange)
  return (
    <div
      ref={listRef}
      role="radiogroup"
      tabIndex={-1}
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn('flex max-w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1', className)}
    >
      {items.map((item) => {
        const selected = item.id === value
        return (
          <button
            key={item.id}
            data-id={item.id}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
            {item.count ? <span className="tabular-nums text-muted-foreground">{item.count}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
