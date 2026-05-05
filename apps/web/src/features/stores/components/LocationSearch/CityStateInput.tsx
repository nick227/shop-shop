/**
 * CityStateInput - Search by city name with optional state;
 * Uses smart fallbacks and database caching to save API quota;
 */
import { useState } from 'react'

interface CityStateInputProps {
  readonly onCitySubmit: (city: string, state?: string) => void;
  readonly isLoading?: boolean;
}

export function CityStateInput({ onCitySubmit, isLoading }: CityStateInputProps) {
  const [cityInput, setCityInput] = useState('')
  const [stateInput, setStateInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const city = cityInput.trim()
    const state = stateInput.trim()
    
    if (!city) return;
    onCitySubmit(city, state || undefined)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-3">
        <input
          type="text"
          className="h-11 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          placeholder="City name (e.g., Austin)"
          disabled={isLoading}
        />
        <input
          type="text"
          className="h-11 w-16 rounded-lg border border-border bg-background px-2 text-center text-sm uppercase text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
          value={stateInput}
          onChange={(e) => setStateInput(e.target.value.toUpperCase())}
          placeholder="ST"
          maxLength={2}
          disabled={isLoading}
        />
      </div>
      <button
        type="submit" 
        className="h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!cityInput.trim() || isLoading}
      >
        {isLoading ? 'Searching...' : 'Search by City'}
      </button>
    </form>
  )
}

