import type { RiverFilters as RiverFiltersType } from '@api/types'

interface RiverFiltersProps {
  filters: RiverFiltersType
  onFiltersChange: (filters: RiverFiltersType) => void
}

const SORT_OPTIONS: { value: NonNullable<RiverFiltersType['sortBy']>; label: string }[] = [
  { value: 'recent', label: 'Recent' },
  { value: 'popular', label: 'Popular' },
  { value: 'trending', label: 'Trending' },
]

export const RiverFilters = ({ filters, onFiltersChange }: RiverFiltersProps) => {
  const handleSortChange = (sortBy: RiverFiltersType['sortBy']) => {
    onFiltersChange({ ...filters, sortBy: sortBy ?? 'recent' })
  }

  const handleMediaFilterToggle = () => {
    onFiltersChange({ ...filters, hasMedia: !filters.hasMedia })
  }

  return (
    <nav
      aria-label="Feed filters"
      className="flex gap-2 overflow-x-auto pb-0.5 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none"
    >
      {SORT_OPTIONS.map((option) => {
        const isActive = filters.sortBy === option.value
        return (
          <button
            key={option.value}
            onClick={() => handleSortChange(option.value)}
            aria-pressed={isActive}
            className={[
              'flex-shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-all duration-150 tap-scale',
              isActive
                ? 'bg-foreground text-background shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
            ].join(' ')}
          >
            {option.label}
          </button>
        )
      })}

      <button
        onClick={handleMediaFilterToggle}
        aria-pressed={filters.hasMedia ?? false}
        className={[
          'flex-shrink-0 h-9 px-4 rounded-full text-sm font-medium flex items-center gap-1.5 transition-all duration-150 tap-scale',
          filters.hasMedia
            ? 'bg-foreground text-background shadow-sm'
            : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
        ].join(' ')}
      >
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        Media
      </button>
    </nav>
  )
}
