import { forwardRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '../Input'
import { cn } from '@shared/lib/cn'

/**
 * SearchInput - Modern search input with Tailwind;
 */

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  onClear?: () => void;
  showClearButton?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, showClearButton = true, value, ...props }, ref) => {
    const [internalValue, setInternalValue] = useState('')
    const displayValue = value !== undefined ? value : internalValue;
    const hasValue = displayValue.toString().length > 0;
    const handleClear = () => {
      setInternalValue('')
      onClear?.()
    }

    return (
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        
        <Input
          ref={ref}
          type="search"
          className={cn('pl-10 pr-10', className)}
          value={value}
          onChange={(e) => {
            setInternalValue(e.target.value)
            props.onChange?.(e)
          }}
          {...props}
        />

        {showClearButton && hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'

