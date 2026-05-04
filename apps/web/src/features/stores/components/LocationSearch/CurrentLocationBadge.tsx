/**
 * CurrentLocationBadge - Display current selected location;
 */

interface CurrentLocationBadgeProps {
  readonly locationName: string;
  readonly radiusMiles: number;
  readonly onClear: () => void;
  readonly onSetDefault?: () => void;
}

export function CurrentLocationBadge({ 
  locationName, 
  radiusMiles, 
  onClear,
  onSetDefault
}: CurrentLocationBadgeProps) {
  return (
    <div className="">
      <div className="">
        <span className="">📍</span>
        <div className="">
          <div className="">{locationName}</div>
          <div className="">
            Within {radiusMiles} miles
          </div>
        </div>
      </div>
      <div className="">
        {onSetDefault && (
          <button
            type="button"
            className=""
            onClick={onSetDefault}
            aria-label="Set as default location"
            title="Set as default location"
          >
            ⭐
          </button>
        )}
        <button
          type="button"
          className=""
          onClick={onClear}
          aria-label="Clear location"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

