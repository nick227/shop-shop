// @ts-nocheck
/**
 * SmartSuggestions - Intelligent User Experience Components
 * 
 * Provides predictive and intelligent features to enhance user experience
 * and reduce cognitive load through smart suggestions and automation.
 * 
 * Features:
 * - Predictive text and suggestions
 * - Smart form completion
 * - Contextual recommendations
 * - Intelligent error prevention
 * - Performance optimized suggestions
 * - Accessibility compliant interactions
 */

import React, { memo, useCallback, useState, useEffect, useMemo } from 'react'
import { cn } from '@shared/lib/cn'

// ========================================
// Types & Interfaces
// ========================================

export interface SmartSuggestionProps {
  value: string
  suggestions: string[]
  onSelect: (suggestion: string) => void
  onInputChange: (value: string) => void
  placeholder?: string
  maxSuggestions?: number
  minLength?: number
  debounceMs?: number
  disabled?: boolean
  className?: string
}

export interface SmartFormProps {
  fields: SmartFormField[]
  onSubmit: (data: Record<string, any>) => void
  onFieldChange: (field: string, value: any) => void
  suggestions?: Record<string, string[]>
  autoComplete?: boolean
  disabled?: boolean
  className?: string
}

export interface SmartFormField {
  name: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea'
  label: string
  placeholder?: string
  required?: boolean
  validation?: (value: any) => string | null
  suggestions?: string[]
  autoComplete?: boolean
}

export interface ContextualRecommendationsProps {
  context: string
  recommendations: Recommendation[]
  onSelect: (recommendation: Recommendation) => void
  maxItems?: number
  disabled?: boolean
  className?: string
}

export interface Recommendation {
  id: string
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  category?: string
  confidence?: number
  action?: () => void
}

export interface PredictiveSearchProps {
  query: string
  onQueryChange: (query: string) => void
  onSelect: (result: SearchResult) => void
  searchFunction: (query: string) => Promise<SearchResult[]>
  placeholder?: string
  maxResults?: number
  debounceMs?: number
  disabled?: boolean
  className?: string
}

export interface SearchResult {
  id: string
  title: string
  description?: string
  category?: string
  relevance?: number
  action?: () => void
}

// ========================================
// SmartSuggestion Component
// ========================================

const SmartSuggestionComponent = memo<SmartSuggestionProps>(({
  value,
  suggestions,
  onSelect,
  onInputChange,
  placeholder = 'Type to search...',
  maxSuggestions = 5,
  minLength = 2,
  debounceMs = 300,
  disabled = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  // Filter suggestions based on input
  useEffect(() => {
    if (value.length < minLength) {
      setFilteredSuggestions([])
      setIsOpen(false)
      return
    }
    
    const filtered = suggestions
      .filter(suggestion => 
        suggestion.toLowerCase().includes(value.toLowerCase())
      )
      .slice(0, maxSuggestions)
    
    setFilteredSuggestions(filtered)
    setIsOpen(filtered.length > 0)
    setSelectedIndex(-1)
  }, [value, suggestions, minLength, maxSuggestions])
  
  // Debounced input change
  useEffect(() => {
    const timer = setTimeout(() => {
      onInputChange(value)
    }, debounceMs)
    
    return () => clearTimeout(timer)
  }, [value, onInputChange, debounceMs])
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onInputChange(newValue)
  }, [onInputChange])
  
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    onSelect(suggestion)
    setIsOpen(false)
    setSelectedIndex(-1)
  }, [onSelect])
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredSuggestions.length === 0) return
    
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        )
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        )
        break
      }
      case 'Enter': {
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSuggestionSelect(filteredSuggestions[selectedIndex])
        }
        break
      }
      case 'Escape': {
        setIsOpen(false)
        setSelectedIndex(-1)
        break
      }
    }
  }, [isOpen, filteredSuggestions, selectedIndex, handleSuggestionSelect])
  
  const inputClasses = cn(
    'w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-normal',
    {
      'opacity-50 cursor-not-allowed': disabled,
    },
    className
  )
  
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(filteredSuggestions.length > 0)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClasses}
        autoComplete="off"
      />
      
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionSelect(suggestion)}
              className={cn(
                'w-full px-4 py-2 text-left hover:bg-accent transition-colors duration-fast',
                {
                  'bg-accent': index === selectedIndex,
                }
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})

SmartSuggestionComponent.displayName = 'SmartSuggestion'

// ========================================
// SmartForm Component
// ========================================

const SmartFormComponent = memo<SmartFormProps>(({
  fields,
  onSubmit,
  onFieldChange,
  suggestions = {},
  autoComplete = true,
  disabled = false,
  className
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    onFieldChange(fieldName, value)
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }))
    }
  }, [onFieldChange, errors])
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields
    const newErrors: Record<string, string> = {}
    for (const field of fields) {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`
      } else if (field.validation) {
        const error = field.validation(formData[field.name])
        if (error) {
          newErrors[field.name] = error
        }
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    onSubmit(formData)
  }, [fields, formData, onSubmit])
  
  const renderField = useCallback((field: SmartFormField) => {
    const fieldSuggestions = suggestions[field.name] || field.suggestions || []
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number': {
        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>
            {fieldSuggestions.length > 0 ? (
              <SmartSuggestion
                value={formData[field.name] || ''}
                suggestions={fieldSuggestions}
                onSelect={(value) => handleFieldChange(field.name, value)}
                onInputChange={(value) => handleFieldChange(field.name, value)}
                placeholder={field.placeholder}
                disabled={disabled}
              />
            ) : (
              <input
                type={field.type}
                value={formData[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                disabled={disabled}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-normal"
                autoComplete={field.autoComplete ? 'on' : 'off'}
              />
            )}
            {errors[field.name] && (
              <p className="text-sm text-destructive">{errors[field.name]}</p>
            )}
          </div>
        )
      }
      
      case 'textarea': {
        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>
            <textarea
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              disabled={disabled}
              rows={4}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-normal resize-none"
            />
            {errors[field.name] && (
              <p className="text-sm text-destructive">{errors[field.name]}</p>
            )}
          </div>
        )
      }
      
      case 'select': {
        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>
            <select
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-normal"
            >
              <option value="">Select {field.label}</option>
              {fieldSuggestions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors[field.name] && (
              <p className="text-sm text-destructive">{errors[field.name]}</p>
            )}
          </div>
        )
      }
      
      default: {
        return null
      }
    }
  }, [formData, errors, handleFieldChange, disabled, suggestions])
  
  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {fields.map(renderField)}
      <button
        type="submit"
        disabled={disabled}
        className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-normal disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit
      </button>
    </form>
  )
})

SmartFormComponent.displayName = 'SmartForm'

// ========================================
// ContextualRecommendations Component
// ========================================

const ContextualRecommendationsComponent = memo<ContextualRecommendationsProps>(({
  context,
  recommendations,
  onSelect,
  maxItems = 5,
  disabled = false,
  className
}) => {
  const [filteredRecommendations, setFilteredRecommendations] = useState<Recommendation[]>([])
  
  useEffect(() => {
    const filtered = recommendations
      .filter(rec => rec.category === context || !rec.category)
      .slice(0, maxItems)
    
    setFilteredRecommendations(filtered)
  }, [context, recommendations, maxItems])
  
  const handleSelect = useCallback((recommendation: Recommendation) => {
    if (disabled) return
    
    onSelect(recommendation)
    if (recommendation.action) {
      recommendation.action()
    }
  }, [onSelect, disabled])
  
  if (filteredRecommendations.length === 0) return null
  
  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="text-sm font-medium text-muted-foreground">
        Recommendations for {context}
      </h3>
      {filteredRecommendations.map((recommendation) => (
        <button
          key={recommendation.id}
          type="button"
          onClick={() => handleSelect(recommendation)}
          disabled={disabled}
          className="w-full p-3 text-left bg-card border border-border rounded-lg hover:bg-accent transition-colors duration-normal disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-start gap-3">
            {recommendation.icon && (
              <recommendation.icon className="h-5 w-5 text-muted-foreground mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-foreground truncate">
                {recommendation.title}
              </h4>
              {recommendation.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {recommendation.description}
                </p>
              )}
              {recommendation.confidence && (
                <div className="mt-2">
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-normal"
                      style={{ width: `${recommendation.confidence * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(recommendation.confidence * 100)}% confidence
                  </p>
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
})

ContextualRecommendationsComponent.displayName = 'ContextualRecommendations'

// ========================================
// PredictiveSearch Component
// ========================================

const PredictiveSearchComponent = memo<PredictiveSearchProps>(({
  query,
  onQueryChange,
  onSelect,
  searchFunction,
  placeholder = 'Search...',
  maxResults = 10,
  debounceMs = 300,
  disabled = false,
  className
}) => {
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }
    
    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const searchResults = await searchFunction(query)
        setResults(searchResults.slice(0, maxResults))
        setIsOpen(searchResults.length > 0)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
        setIsOpen(false)
      } finally {
        setIsLoading(false)
      }
    }, debounceMs)
    
    return () => clearTimeout(timer)
  }, [query, searchFunction, maxResults, debounceMs])
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onQueryChange(e.target.value)
  }, [onQueryChange])
  
  const handleResultSelect = useCallback((result: SearchResult) => {
    onSelect(result)
    setIsOpen(false)
    setSelectedIndex(-1)
    if (result.action) {
      result.action()
    }
  }, [onSelect])
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return
    
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        )
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        )
        break
      }
      case 'Enter': {
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleResultSelect(results[selectedIndex])
        }
        break
      }
      case 'Escape': {
        setIsOpen(false)
        setSelectedIndex(-1)
        break
      }
    }
  }, [isOpen, results, selectedIndex, handleResultSelect])
  
  return (
    <div className={cn('relative', className)}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(results.length > 0)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-normal"
        autoComplete="off"
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
      
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={result.id}
              type="button"
              onClick={() => handleResultSelect(result)}
              className={cn(
                'w-full px-4 py-3 text-left hover:bg-accent transition-colors duration-fast',
                {
                  'bg-accent': index === selectedIndex,
                }
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {result.title}
                  </h4>
                  {result.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {result.description}
                    </p>
                  )}
                  {result.category && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                      {result.category}
                    </span>
                  )}
                </div>
                {result.relevance && (
                  <div className="text-xs text-muted-foreground">
                    {Math.round(result.relevance * 100)}%
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
})

PredictiveSearchComponent.displayName = 'PredictiveSearch'

// ========================================
// Exports
// ========================================

export { SmartSuggestionComponent as SmartSuggestion }
export { SmartFormComponent as SmartForm }
export { ContextualRecommendationsComponent as ContextualRecommendations }
export { PredictiveSearchComponent as PredictiveSearch }

export default SmartSuggestionComponent
export type { 
  SmartSuggestionProps, 
  SmartFormProps, 
  SmartFormField, 
  ContextualRecommendationsProps, 
  Recommendation, 
  PredictiveSearchProps, 
  SearchResult 
}
