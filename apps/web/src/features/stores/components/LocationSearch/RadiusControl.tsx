/**
 * RadiusControl - Slider for search radius adjustment;
 */

interface RadiusControlProps {
  readonly radius: number;
  readonly onRadiusChange: (newRadius: number) => void;
}

export function RadiusControl({ radius, onRadiusChange }: RadiusControlProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <label htmlFor="radius-slider" className="mb-3 block text-sm text-muted-foreground">
        Search Radius: <strong>{radius} miles</strong>
      </label>
      <input
        id="radius-slider"
        type="range"
        min="5"
        max="100"
        step="5"
        value={radius}
        onChange={(e) => onRadiusChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary"
        aria-label={'Search radius: ' + radius + ' miles'}
        aria-valuemin={5}
        aria-valuemax={100}
        aria-valuenow={radius}
        aria-valuetext={'' + radius + ' miles'}
      />
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>5 mi</span>
        <span>50 mi</span>
        <span>100 mi</span>
      </div>
    </div>
  )
}

