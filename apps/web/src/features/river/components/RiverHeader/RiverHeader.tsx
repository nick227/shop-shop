import { useState } from 'react'
import { Search, MapPin, Filter, TrendingUp } from 'lucide-react'
import { Button } from '@shared/ui/primitives'
import type { RiverFilters } from '@api/types'

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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">River</h1>
            <div className="hidden sm:flex items-center gap-1 text-sm text-gray-500">
              <TrendingUp className="w-4 h-4" />
              <span>Trending now</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={showLocation ? "default" : "outline"}
              size="small"
              onClick={handleLocationToggle}
              className="flex items-center gap-2"
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search posts, stores, or products..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </header>
  )
}
