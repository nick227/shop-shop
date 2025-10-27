import type { RiverFilters as RiverFiltersType } from '@api/types'

interface RiverFiltersProps {
  filters: RiverFiltersType
  onFiltersChange: (filters: RiverFiltersType) => void
}

export const RiverFilters = ({ filters, onFiltersChange }: RiverFiltersProps) => {
  const sortOptions: { value: RiverFiltersType["sortBy"]; label: string }[] = [
    { value: 'recent', label: 'Recent' },
    { value: 'popular', label: 'Popular' },
    { value: 'trending', label: 'Trending' },
  ]

  const handleSortChange = (sortBy: RiverFiltersType["sortBy"]) => {
    onFiltersChange({ ...filters, sortBy: sortBy ?? 'recent' })
  }

  const handleMediaFilterToggle = () => {
    onFiltersChange({
      ...filters,
      hasMedia: filters.hasMedia ? false : true,
    })
  }

  return (
    <nav className="flex gap-2 mb-8 overflow-x-auto pb-2">
      <div className="flex gap-2">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            className={'px-6 py-3 border-2 rounded-lg font-medium whitespace-nowrap transition-all ' + 
              filters.sortBy === option.value 
                ? 'border-primary bg-primary text-primary-foreground' 
                : 'border-border bg-background hover:border-primary hover:bg-accent'
             + ''}
            onClick={() => handleSortChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <button
        className={'px-4 py-2 border-2 rounded-lg hover:border-primary transition-colors flex items-center gap-2 ' + 
          filters.hasMedia ? 'border-primary bg-accent' : 'border-border bg-background'
         + ''}
        onClick={handleMediaFilterToggle}
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span>Media only</span>
      </button>
    </nav>
  )
}

