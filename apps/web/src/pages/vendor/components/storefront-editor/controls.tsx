/**
 * Small controls shared by the storefront editor's panels.
 */
import { useId, useRef, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@shared/ui/primitives'
import { cn } from '@shared/lib/cn'
import { authPost } from '@shared/lib/auth/authFetch'

export function PanelSection({ title, description, children }: {
  readonly title: string
  readonly description?: ReactNode
  readonly children: ReactNode
}) {
  return (
    <section className="space-y-3 border-b border-border pb-5 last:border-b-0">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

export function Field({ label, hint, children }: { readonly label: string; readonly hint?: string; readonly children: (id: string) => ReactNode }) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-foreground">
        {label}
      </label>
      {children(id)}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export const inputClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

/** A segmented choice: one of a few options, all visible. */
export function Choice<T extends string>({ label, value, options, onChange }: {
  readonly label: string
  readonly value: T
  readonly options: readonly { readonly id: T; readonly label: ReactNode }[]
  readonly onChange: (value: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={value === option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            'flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
            value === option.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ label, checked, onChange, description }: {
  readonly label: string
  readonly checked: boolean
  readonly onChange: (checked: boolean) => void
  readonly description?: string
}) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-3">
      <label htmlFor={id} className="text-sm">
        <span className="font-medium">{label}</span>
        {description ? <span className="block text-xs text-muted-foreground">{description}</span> : null}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-muted-foreground/30',
        )}
      >
        <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform', checked ? 'translate-x-4' : 'translate-x-0.5')} />
      </button>
    </div>
  )
}

/** Moves one entry of a list up or down. */
export function moveInList<T>(list: readonly T[], index: number, offset: -1 | 1): T[] {
  const target = index + offset
  if (target < 0 || target >= list.length) return [...list]
  return list.map((entry, i) => {
    if (i === index) return list[target]
    if (i === target) return list[index]
    return entry
  })
}

/** A row in an ordered list: content, then move up / move down / optional hide / remove. */
export function OrderedRow({ label, children, index, count, onMove, onRemove, visible, onToggleVisible }: {
  readonly label: string
  readonly children: ReactNode
  readonly index: number
  readonly count: number
  readonly onMove: (offset: -1 | 1) => void
  readonly onRemove?: () => void
  readonly visible?: boolean
  readonly onToggleVisible?: () => void
}) {
  return (
    <li className={cn('flex items-center gap-2 rounded-lg border border-border bg-background p-2', visible === false && 'opacity-60')}>
      <div className="min-w-0 flex-1">{children}</div>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => onMove(-1)}>
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label={`Move ${label} down`}
        disabled={index === count - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
      {onToggleVisible ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          aria-pressed={!visible}
          onClick={onToggleVisible}
        >
          {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
      ) : null}
      {onRemove ? (
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label={`Remove ${label}`} onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </li>
  )
}

export interface UploadedMedia {
  readonly id: string
  readonly url: string
  readonly kind: string
}

/** Uploads photos or videos to the store's media library. */
export function UploadButton({ storeId, onUploaded, label = 'Upload photo or video' }: {
  readonly storeId: string
  readonly onUploaded: (media: UploadedMedia[]) => void
  readonly label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setBusy(true)
    const done: UploadedMedia[] = []
    try {
      for (const file of [...files]) {
        const form = new FormData()
        form.append('file', file)
        form.append('storeId', storeId)
        const response = await authPost('/api/media/upload', form)
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string }
          throw new Error(body.error ?? `Could not upload ${file.name}`)
        }
        done.push((await response.json()) as UploadedMedia)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
      if (done.length > 0) onUploaded(done)
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => void upload(e.target.files)}
      />
      <Button type="button" variant="outline" size="small" isLoading={busy} disabled={busy} onClick={() => inputRef.current?.click()}>
        <Upload className="h-4 w-4" />
        {label}
      </Button>
    </>
  )
}
