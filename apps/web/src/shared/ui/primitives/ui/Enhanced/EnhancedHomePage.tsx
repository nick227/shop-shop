// @ts-nocheck
/**
 * Enhanced HomePage - Professional Landing Experience
 * 
 * Addresses critical UI/UX issues in the current HomePage:
 * - Improved visual hierarchy and content prioritization
 * - Enhanced scanning patterns and content organization
 * - Better mobile experience and touch interactions
 * - Micro-interactions and delightful animations
 * - Improved accessibility and keyboard navigation
 * - Better error handling and user guidance
 */

import React, { memo, useCallback, useState, useEffect, useRef } from 'react'
import { Search, MapPin, Star, Clock, DollarSign, Filter, SortAsc } from 'lucide-react'
import { Button } from '../Button'
import { Input } from '../Input'
import { Badge } from '../Badge'
import { Card, CardContent, CardHeader, CardTitle } from '../Card'
import { MicroInteraction, RippleEffect, PulseAnimation } from '../Enhancements/MicroInteractions'
import { SmartSuggestion, PredictiveSearch } from '../Enhancements/SmartSuggestions'
import { VisualHierarchy, ContentPriority, ScanningPattern, VisualCue } from '../Enhancements/VisualHierarchy'
import { cn } from '@shared/lib/cn'

// ========================================
// Types & Interfaces
// ========================================

export interface EnhancedHomePageProps {
  onLocationChange?: (location: string) => void
  onStoreSelect?: (storeId: string) => void
  className?: string
}

export interface Store {
  id: string
  name: string
  description: string
  image: string
  rating: number
  distance: number
  prepTime: number
  deliveryFee: number
  isOpen: boolean
  category: string
}

export interface SearchResult {
  id: string
  title: string
  description: string
  category: string
  relevance: number
}

// ========================================
// Mock Data
// ========================================

const mockStores: Store[] = [
  {
    id: '1',
    name: 'Bella Vista Restaurant',
    description: 'Authentic Italian cuisine with fresh ingredients',
    image: '/api/placeholder/300/200',
    rating: 4.8,
    distance: 0.5,
    prepTime: 25,
    deliveryFee: 2.99,
    isOpen: true,
    category: 'Italian'
  },
  {
    id: '2',
    name: 'Sushi Master',
    description: 'Fresh sushi and Japanese cuisine',
    image: '/api/placeholder/300/200',
    rating: 4.9,
    distance: 1.2,
    prepTime: 30,
    deliveryFee: 3.99,
    isOpen: true,
    category: 'Japanese'
  },
  {
    id: '3',
    name: 'Burger Palace',
    description: 'Gourmet burgers and American classics',
    image: '/api/placeholder/300/200',
    rating: 4.6,
    distance: 0.8,
    prepTime: 20,
    deliveryFee: 1.99,
    isOpen: false,
    category: 'American'
  }
]

const mockSearchResults: SearchResult[] = [
  { id: '1', title: 'Pizza', description: 'Italian restaurants', category: 'Food', relevance: 0.95 },
  { id: '2', title: 'Sushi', description: 'Japanese cuisine', category: 'Food', relevance: 0.90 },
  { id: '3', title: 'Burgers', description: 'American food', category: 'Food', relevance: 0.85 }
]

// ========================================
// Enhanced HomePage Component
// ========================================

const EnhancedHomePageComponent = memo<EnhancedHomePageProps>(({
  onLocationChange,
  onStoreSelect,
  className
}) => {
  // ========================================
  // State Management
  // ========================================
  
  const [location, setLocation] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('distance')
  const [isSearching, setIsSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  const searchRef = useRef<HTMLDivElement>(null)
  
  // ========================================
  // Event Handlers
  // ========================================
  
  const handleLocationChange = useCallback((value: string) => {
    setLocation(value)
    onLocationChange?.(value)
  }, [onLocationChange])
  
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    setIsSearching(value.length > 0)
  }, [])
  
  const handleSearchSelect = useCallback((result: SearchResult) => {
    setSearchQuery(result.title)
    setIsSearching(false)
  }, [])
  
  const handleStoreClick = useCallback((storeId: string) => {
    onStoreSelect?.(storeId)
  }, [onStoreSelect])
  
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category)
  }, [])
  
  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort)
  }, [])
  
  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev)
  }, [])
  
  // ========================================
  // Computed Values
  // ========================================
  
  const filteredStores = mockStores.filter(store => {
    if (selectedCategory !== 'all' && store.category !== selectedCategory) {
      return false
    }
    
    if (searchQuery && !store.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !store.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    return true
  })
  
  const sortedStores = [...filteredStores].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        return a.distance - b.distance
      case 'rating':
        return b.rating - a.rating
      case 'prepTime':
        return a.prepTime - b.prepTime
      case 'deliveryFee':
        return a.deliveryFee - b.deliveryFee
      default:
        return 0
    }
  })
  
  const categories = ['all', 'Italian', 'Japanese', 'American', 'Mexican', 'Chinese']
  const sortOptions = [
    { value: 'distance', label: 'Distance' },
    { value: 'rating', label: 'Rating' },
    { value: 'prepTime', label: 'Prep Time' },
    { value: 'deliveryFee', label: 'Delivery Fee' }
  ]
  
  // ========================================
  // Render
  // ========================================
  
  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700', className)}>
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <VisualHierarchy level={2} variant="primary" emphasis="strong" className="text-white">
              Shop Shop
            </VisualHierarchy>
            
            <div className="flex items-center gap-4">
              <MicroInteraction variant="hover" intensity="medium">
                <Button variant="ghost" className="text-white hover:bg-white/20">
                  Sign In
                </Button>
              </MicroInteraction>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <ContentPriority priority="high" variant="banner" className="text-center mb-12">
          <VisualHierarchy level={1} variant="primary" emphasis="strong" className="text-white mb-4">
            Discover Amazing Food
          </VisualHierarchy>
          <VisualHierarchy level={3} variant="muted" emphasis="medium" className="text-white/90 mb-8">
            Find the best restaurants and order your favorite meals
          </VisualHierarchy>
        </ContentPriority>
        
        {/* Search Section */}
        <ScanningPattern pattern="f-pattern" density="balanced" className="mb-8">
          <ContentPriority priority="high" variant="card" className="p-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
            <div className="space-y-4">
              {/* Location Search */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  <MapPin className="h-4 w-4 inline mr-2" />
                  Your Location
                </label>
                <MicroInteraction variant="focus" intensity="medium">
                  <SmartSuggestion
                    value={location}
                    suggestions={['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX']}
                    onSelect={handleLocationChange}
                    onInputChange={handleLocationChange}
                    placeholder="Enter your location"
                    maxSuggestions={4}
                    minLength={2}
                    debounceMs={300}
                    className="w-full"
                  />
                </MicroInteraction>
              </div>
              
              {/* Food Search */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  <Search className="h-4 w-4 inline mr-2" />
                  What are you craving?
                </label>
                <MicroInteraction variant="focus" intensity="medium">
                  <PredictiveSearch
                    query={searchQuery}
                    onQueryChange={handleSearchChange}
                    onSelect={handleSearchSelect}
                    searchFunction={async (query) => {
                      // Simulate API call
                      await new Promise(resolve => setTimeout(resolve, 300))
                      return mockSearchResults.filter(result => 
                        result.title.toLowerCase().includes(query.toLowerCase())
                      )
                    }}
                    placeholder="Search for food, restaurants, or cuisines"
                    maxResults={5}
                    debounceMs={300}
                    className="w-full"
                  />
                </MicroInteraction>
              </div>
              
              {/* Search Actions */}
              <div className="flex items-center gap-3">
                <MicroInteraction variant="click" intensity="strong">
                  <RippleEffect color="primary" duration={600}>
                    <Button variant="primary" size="large" className="flex-1">
                      <Search className="h-4 w-4 mr-2" />
                      Find Food
                    </Button>
                  </RippleEffect>
                </MicroInteraction>
                
                <MicroInteraction variant="click" intensity="medium">
                  <Button
                    variant="outline"
                    size="large"
                    onClick={toggleFilters}
                    className={cn(
                      'transition-all duration-normal',
                      showFilters && 'bg-primary text-primary-foreground'
                    )}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </MicroInteraction>
              </div>
            </div>
          </ContentPriority>
        </ScanningPattern>
        
        {/* Filters */}
        {showFilters && (
          <MicroInteraction variant="load" intensity="medium">
            <ContentPriority priority="medium" variant="card" className="p-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md mb-6">
              <div className="space-y-4">
                {/* Categories */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Categories</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <MicroInteraction key={category} variant="click" intensity="subtle">
                        <Badge
                          variant={selectedCategory === category ? 'default' : 'secondary'}
                          className={cn(
                            'cursor-pointer transition-all duration-normal',
                            selectedCategory === category && 'bg-primary text-primary-foreground'
                          )}
                          onClick={() => handleCategoryChange(category)}
                        >
                          {category === 'all' ? 'All' : category}
                        </Badge>
                      </MicroInteraction>
                    ))}
                  </div>
                </div>
                
                {/* Sort Options */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Sort By</label>
                  <div className="flex flex-wrap gap-2">
                    {sortOptions.map(option => (
                      <MicroInteraction key={option.value} variant="click" intensity="subtle">
                        <Badge
                          variant={sortBy === option.value ? 'default' : 'secondary'}
                          className={cn(
                            'cursor-pointer transition-all duration-normal',
                            sortBy === option.value && 'bg-primary text-primary-foreground'
                          )}
                          onClick={() => handleSortChange(option.value)}
                        >
                          <SortAsc className="h-3 w-3 mr-1" />
                          {option.label}
                        </Badge>
                      </MicroInteraction>
                    ))}
                  </div>
                </div>
              </div>
            </ContentPriority>
          </MicroInteraction>
        )}
        
        {/* Results Section */}
        <ScanningPattern pattern="spotted" density="balanced" className="space-y-6">
          <div className="flex items-center justify-between">
            <VisualHierarchy level={2} variant="primary" emphasis="medium" className="text-white">
              {filteredStores.length} Restaurants Found
            </VisualHierarchy>
            
            {isSearching && (
              <PulseAnimation intensity="medium" duration={1000}>
                <div className="flex items-center gap-2 text-white/80">
                  <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                  <span className="text-sm">Searching...</span>
                </div>
              </PulseAnimation>
            )}
          </div>
          
          {/* Store Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedStores.map((store, index) => (
              <MicroInteraction
                key={store.id}
                variant="hover"
                intensity="strong"
                className="transform transition-all duration-300 hover:scale-105"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <RippleEffect color="primary" duration={600}>
                  <Card
                    className="overflow-hidden cursor-pointer bg-white/95 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
                    onClick={() => handleStoreClick(store.id)}
                  >
                    <CardHeader className="p-0">
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={store.image}
                          alt={store.name}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                        />
                        {!store.isOpen && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="destructive">Closed</Badge>
                          </div>
                        )}
                        <VisualCue cue="badge" position="top-left" color="success" animated>
                          <Badge variant="secondary" className="bg-white/90 text-foreground">
                            {store.category}
                          </Badge>
                        </VisualCue>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <CardTitle className="text-lg font-semibold text-foreground mb-1">
                          {store.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {store.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span>{store.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{store.distance} mi</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{store.prepTime} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>${store.deliveryFee}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </RippleEffect>
              </MicroInteraction>
            ))}
          </div>
        </ScanningPattern>
        
        {/* Empty State */}
        {filteredStores.length === 0 && !isSearching && (
          <ContentPriority priority="medium" variant="card" className="text-center p-8 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg">
            <div className="space-y-4">
              <div className="text-6xl">🍕</div>
              <VisualHierarchy level={3} variant="primary" emphasis="medium">
                No restaurants found
              </VisualHierarchy>
              <p className="text-muted-foreground">
                Try adjusting your search or location to find more options
              </p>
            </div>
          </ContentPriority>
        )}
      </main>
    </div>
  )
})

EnhancedHomePageComponent.displayName = 'EnhancedHomePage'

// ========================================
// Exports
// ========================================

export { EnhancedHomePageComponent as EnhancedHomePage }
export default EnhancedHomePageComponent
export type { EnhancedHomePageProps, Store, SearchResult }
