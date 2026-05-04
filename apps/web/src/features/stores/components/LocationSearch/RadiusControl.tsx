/**
 * RadiusControl - Slider for search radius adjustment;
 */

interface RadiusControlProps {
  readonly radius: number;
  readonly onRadiusChange: (newRadius: number) => void;
}

export function RadiusControl({ radius, onRadiusChange }: RadiusControlProps) {
  return (
    <div className="flex items-center gap-4 mt-4">
      <label htmlFor="radius-slider" className="">
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
        className=""
        aria-label={'Search radius: ' + radius + ' miles'}
        aria-valuemin={5}
        aria-valuemax={100}
        aria-valuenow={radius}
        aria-valuetext={'' + radius + ' miles'}
      />
      <div className="">
        <span>5 mi</span>
        <span>50 mi</span>
        <span>100 mi</span>
      </div>
    </div>
  )
}

