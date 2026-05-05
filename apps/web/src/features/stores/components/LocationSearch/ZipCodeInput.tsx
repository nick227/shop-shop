/**
 * ZipCodeInput - ZIP code search form;
 */
import { useState } from 'react'

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        className="h-11 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
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
        className="h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={zipCode.length !== 5 || !/^\d{5}$/.test(zipCode) || isLoading}
      >
        {isLoading ? 'Searching...' : 'Search'}
      </button>
    </form>
  )
}

