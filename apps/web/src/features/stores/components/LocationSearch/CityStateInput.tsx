/**
 * CityStateInput - Search by city name with optional state;
 * Uses smart fallbacks and database caching to save API quota;
 */
import { useState } from 'react'
import styles from './LocationSearch.module.css'

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
    <form onSubmit={handleSubmit} className={styles.cityForm}>
      <div className={styles.cityInputs}>
        <input
          type="text"
          className={styles.cityInput}
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          placeholder="City name (e.g., Austin)"
          disabled={isLoading}
        />
        <input
          type="text"
          className={styles.stateInput}
          value={stateInput}
          onChange={(e) => setStateInput(e.target.value.toUpperCase())}
          placeholder="ST"
          maxLength={2}
          disabled={isLoading}
        />
      </div>
      <button
        type="submit" 
        className={styles.searchButton}
        disabled={!cityInput.trim() || isLoading}
      >
        {isLoading ? 'Searching...' : 'Search by City'}
      </button>
    </form>
  )
}

