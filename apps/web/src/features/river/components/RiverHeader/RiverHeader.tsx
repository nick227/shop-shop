import { useState } from 'react'
import { Search, MapPin, Filter, TrendingUp } from 'lucide-react'
import { Button } from '@shared/ui/primitives'
import type { RiverFilters } from '@api/types'
import { PAGE_SHELL_CONTAINER_CLASS } from '@shared/ui/layout/PageShell'
import { cn } from '@shared/lib/cn'

interface RiverHeaderProps {
  filters: RiverFilters
  onFiltersChange: (filters: RiverFilters) => void
}

export function RiverHeader({ filters, onFiltersChange }: RiverHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showLocation, setShowLocation] = useState(false)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // TODO: Implement search functionality
  }

  const handleLocationToggle = () => {
    setShowLocation(!showLocation)
    if (!showLocation) {
      // Request geolocation
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onFiltersChange({
            ...filters,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    } else {
      onFiltersChange({
        ...filters,
        lat: undefined,
        lng: undefined,
      })
    }
  }

  return (
    <header className="sticky top-16 z-40 border-b border-gray-100 backdrop-blur-md bg-white/95">
      <div className={cn(PAGE_SHELL_CONTAINER_CLASS, 'max-w-5xl py-4')}>
        <div className="flex justify-between items-center mb-4">
          
          <div className="flex gap-2 items-center">
            <Button
              variant={showLocation ? "primary" : "outline"}
              size="small"
              onClick={handleLocationToggle}
              className="flex gap-2 items-center"
            >
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">
                {showLocation ? 'Nearby' : 'All'}
              </span>
            </Button>
            
            <Button variant="outline" size="small">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search posts, stores, or products..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="py-3 pr-4 pl-10 w-full bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </header>
  )
}
