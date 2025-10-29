/**
 * SearchBar - Unified search input component
 * Supports keyword search, location search, and filters
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@shared/ui/primitives'
import type { SearchInputType } from '@shared/types'
import styles from './SearchBar.module.css'

export interface SearchBarProps {
  onSearch: (query: string, inputType: SearchInputType) => void
  placeholder?: string
  showLocationToggle?: boolean
  showFilters?: boolean
  initialValue?: string
  className?: string
}

export function SearchBar({
  onSearch,
  placeholder = 'Search for restaurants, dishes, or cuisines...',
  showLocationToggle = true,
  showFilters = true,
  initialValue = '',
  className = ''
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue)
  const [inputType, setInputType] = useState<SearchInputType>('keyword')
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle search submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim(), inputType)
    }
  }, [query, inputType, onSearch])

  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }, [])

  // Toggle input type
  const handleInputTypeToggle = useCallback(() => {
    setInputType(prev => prev === 'keyword' ? 'location' : 'keyword')
  }, [])

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <form onSubmit={handleSubmit} className={`${styles.searchBar} ${className || ''}`}>
      <div className={styles.inputWrapper}>
        {/* Input type indicator */}
        <span className={styles.inputIcon}>
          {inputType === 'keyword' ? '🔍' : '📍'}
        </span>

        {/* Search input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={inputType === 'keyword' 
            ? placeholder 
            : 'Enter ZIP code or city...'
          }
          className={styles.input}
          aria-label="Search"
        />

        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className={styles.clearButton}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className={styles.actions}>
        {showLocationToggle && (
          <button
            type="button"
            onClick={handleInputTypeToggle}
            className={styles.toggleButton}
            aria-label={'Switch to ' + inputType === 'keyword' ? 'location' : 'keyword' + ' search'}
            title={inputType === 'keyword' ? 'Search by location' : 'Search by keyword'}
          >
            {inputType === 'keyword' ? '📍' : '🔍'}
          </button>
        )}

        {showFilters && (
          <button
            type="button"
            className={styles.filterButton}
            aria-label="Open filters"
            title="Filters"
          >
            ⚙️
          </button>
        )}

        <Button
          type="submit"
          variant="primary"
          size="large"
          disabled={!query.trim()}
          className={styles.submitButton}
        >
          Search
        </Button>
      </div>
    </form>
  )
}

