/**
 * ZipCodeInput - ZIP code search form;
 */
import { useState } from 'react'
import { styles } from '@utils/tailwind-classes'

interface ZipCodeInputProps {
  readonly onZipSubmit: (zipCode: string) => void;
  readonly isLoading?: boolean;
  readonly error?: string;
}

export function ZipCodeInput({ onZipSubmit, isLoading = false }: ZipCodeInputProps) {
  const [zipCode, setZipCode] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanZip = zipCode.trim()
    if (cleanZip?.length === 5 && /^\d{5}$/.test(cleanZip)) {
      onZipSubmit(cleanZip)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.zipForm}>
      <input
        type="text"
        className={styles.zipInput}
        placeholder="Enter ZIP code"
        value={zipCode}
        onChange={(e) => setZipCode(e.target.value)}
        maxLength={5}
        pattern="[0-9]{5}"
        aria-label="ZIP code"
        disabled={isLoading}
      />
      <button
        type="submit" 
        className={styles.searchButton}
        disabled={zipCode.length !== 5 || !/^\d{5}$/.test(zipCode) || isLoading}
      >
        {isLoading ? 'Searching...' : 'Search'}
      </button>
    </form>
  )
}

