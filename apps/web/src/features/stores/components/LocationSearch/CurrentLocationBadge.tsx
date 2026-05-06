/**
 * CurrentLocationBadge - Display current selected location;
 */

interface CurrentLocationBadgeProps {
  readonly locationName: string;
  readonly onClear: () => void;
  readonly onSetDefault?: () => void;
}

export function CurrentLocationBadge({ 
  locationName, 
  onClear,
  onSetDefault
}: CurrentLocationBadgeProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-success/30 bg-success/10 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-base leading-none">📍</span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{locationName}</div>
          <div className="text-xs text-muted-foreground">Applied when you browse search results</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onSetDefault && (
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            onClick={onSetDefault}
            aria-label="Set as default location"
            title="Set as default location"
          >
            ⭐
          </button>
        )}
        <button
          type="button"
          className="rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onClick={onClear}
          aria-label="Clear location"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

