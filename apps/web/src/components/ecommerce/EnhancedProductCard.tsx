/**
 * Enhanced Product Card - Professional Ecommerce Component
 * 
 * Addresses critical ecommerce UX issues:
 * - Poor product discovery and presentation
 * - Missing social proof and trust indicators
 * - Inefficient add-to-cart experience
 * - Poor mobile optimization
 * - Missing product comparison and wishlist features
 */

import React, { memo, useCallback, useState, useMemo } from 'react'
import { Heart, ShoppingCart, Eye, Star, TrendingUp, Shield, Truck, RotateCcw } from 'lucide-react'
import { Button, Badge, Image, Card, CardContent, CardHeader, CardTitle } from '@ui'
import { MicroInteraction, RippleEffect, PulseAnimation } from '@ui/Enhancements/MicroInteractions'
import { VisualCue, ContentPriority } from '@ui/Enhancements/VisualHierarchy'
import { cn } from '@utils/cn'
import { formatCurrency } from '@utils/format'

// ========================================
// Types & Interfaces
// ========================================

export interface EnhancedProductCardProps {
  product: {
    id: string
    title: string
    description: string
    price: number
    originalPrice?: number
    image: string
    images?: string[]
    rating: number
    reviewCount: number
    soldCount?: number
    isOnSale?: boolean
    isNew?: boolean
    isLimited?: boolean
    isFeatured?: boolean
    isInStock?: boolean
    stockCount?: number
    category: string
    brand?: string
    tags?: string[]
    discount?: number
  }
  onAddToCart?: (productId: string, quantity?: number) => void
  onAddToWishlist?: (productId: string) => void
  onQuickView?: (productId: string) => void
  onCompare?: (productId: string) => void
  onViewDetails?: (productId: string) => void
  isAddingToCart?: boolean
  isInWishlist?: boolean
  isInComparison?: boolean
  className?: string
  variant?: 'default' | 'compact' | 'detailed'
  showQuickActions?: boolean
  showSocialProof?: boolean
  showTrustIndicators?: boolean
}

// ========================================
// Enhanced Product Card Component
// ========================================

const EnhancedProductCardComponent = memo<EnhancedProductCardProps>(({
  product,
  onAddToCart,
  onAddToWishlist,
  onQuickView,
  onCompare,
  onViewDetails,
  isAddingToCart = false,
  isInWishlist = false,
  isInComparison = false,
  className,
  variant = 'default',
  showQuickActions = true,
  showSocialProof = true,
  showTrustIndicators = true
}) => {
  // ========================================
  // State Management
  // ========================================
  
  const [isHovered, setIsHovered] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isImageLoading, setIsImageLoading] = useState(true)
  
  // ========================================
  // Computed Values
  // ========================================
  
  const discountPercentage = useMemo(() => {
    if (product.originalPrice && product.price < product.originalPrice) {
      return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    }
    return product.discount || 0
  }, [product.originalPrice, product.price, product.discount])
  
  const isOnSale = useMemo(() => {
    return product.isOnSale || (product.originalPrice && product.price < product.originalPrice)
  }, [product.isOnSale, product.originalPrice, product.price])
  
  const stockStatus = useMemo(() => {
    if (!product.isInStock) return 'out_of_stock'
    if (product.stockCount && product.stockCount < 10) return 'low_stock'
    return 'in_stock'
  }, [product.isInStock, product.stockCount])
  
  const trustScore = useMemo(() => {
    let score = 0
    if (product.rating >= 4.5) score += 30
    if (product.reviewCount >= 100) score += 25
    if (product.soldCount && product.soldCount >= 50) score += 25
    if (product.isFeatured) score += 20
    return Math.min(score, 100)
  }, [product.rating, product.reviewCount, product.soldCount, product.isFeatured])
  
  // ========================================
  // Event Handlers
  // ========================================
  
  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onAddToCart?.(product.id, 1)
  }, [product.id, onAddToCart])
  
  const handleAddToWishlist = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onAddToWishlist?.(product.id)
  }, [product.id, onAddToWishlist])
  
  const handleQuickView = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickView?.(product.id)
  }, [product.id, onQuickView])
  
  const handleCompare = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onCompare?.(product.id)
  }, [product.id, onCompare])
  
  const handleViewDetails = useCallback(() => {
    onViewDetails?.(product.id)
  }, [product.id, onViewDetails])
  
  const handleImageLoad = useCallback(() => {
    setIsImageLoading(false)
  }, [])
  
  const handleImageError = useCallback(() => {
    setIsImageLoading(false)
  }, [])
  
  // ========================================
  // Render
  // ========================================
  
  return (
    <MicroInteraction
      variant="hover"
      intensity="strong"
      className={cn(
        'group relative transform transition-all duration-300 hover:scale-105',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        className="overflow-hidden cursor-pointer bg-white hover:shadow-xl transition-all duration-300"
        onClick={handleViewDetails}
      >
        {/* Image Section */}
        <CardHeader className="p-0 relative">
          <div className="relative aspect-square overflow-hidden">
            {/* Main Image */}
            <Image
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              onLoad={handleImageLoad}
              onError={handleImageError}
              fallbackSeed={product.id}
            />
            
            {/* Loading State */}
            {isImageLoading && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
              </div>
            )}
            
            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {isOnSale && (
                <VisualCue cue="badge" position="top-left" color="destructive" animated>
                  <Badge variant="destructive" className="text-xs font-semibold">
                    -{discountPercentage}%
                  </Badge>
                </VisualCue>
              )}
              
              {product.isNew && (
                <VisualCue cue="badge" position="top-left" color="success" animated>
                  <Badge variant="success" className="text-xs font-semibold">
                    NEW
                  </Badge>
                </VisualCue>
              )}
              
              {product.isLimited && (
                <VisualCue cue="badge" position="top-left" color="warning" animated>
                  <Badge variant="warning" className="text-xs font-semibold">
                    LIMITED
                  </Badge>
                </VisualCue>
              )}
              
              {product.isFeatured && (
                <VisualCue cue="badge" position="top-left" color="primary" animated>
                  <Badge variant="primary" className="text-xs font-semibold">
                    FEATURED
                  </Badge>
                </VisualCue>
              )}
            </div>
            
            {/* Stock Status */}
            <div className="absolute top-2 right-2">
              {stockStatus === 'out_of_stock' && (
                <Badge variant="destructive" className="text-xs">
                  SOLD OUT
                </Badge>
              )}
              {stockStatus === 'low_stock' && (
                <Badge variant="warning" className="text-xs">
                  LOW STOCK
                </Badge>
              )}
            </div>
            
            {/* Quick Actions */}
            {showQuickActions && isHovered && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <MicroInteraction variant="click" intensity="medium">
                  <RippleEffect color="primary" duration={300}>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleQuickView}
                      className="bg-white/90 hover:bg-white"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </RippleEffect>
                </MicroInteraction>
                
                <MicroInteraction variant="click" intensity="medium">
                  <RippleEffect color="primary" duration={300}>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleCompare}
                      className={cn(
                        'bg-white/90 hover:bg-white',
                        isInComparison && 'bg-primary text-primary-foreground'
                      )}
                    >
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                  </RippleEffect>
                </MicroInteraction>
              </div>
            )}
          </div>
        </CardHeader>
        
        {/* Content Section */}
        <CardContent className="p-4 space-y-3">
          {/* Product Info */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200">
                {product.title}
              </CardTitle>
              
              {/* Wishlist Button */}
              <MicroInteraction variant="click" intensity="subtle">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAddToWishlist}
                  className={cn(
                    'p-1 h-auto text-muted-foreground hover:text-destructive transition-colors duration-200',
                    isInWishlist && 'text-destructive'
                  )}
                >
                  <Heart className={cn('h-4 w-4', isInWishlist && 'fill-current')} />
                </Button>
              </MicroInteraction>
            </div>
            
            {product.brand && (
              <p className="text-xs text-muted-foreground">{product.brand}</p>
            )}
            
            {product.description && variant === 'detailed' && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {product.description}
              </p>
            )}
          </div>
          
          {/* Pricing */}
          <ContentPriority priority="high" variant="inline" className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(product.price)}
              </span>
              
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatCurrency(product.originalPrice)}
                </span>
              )}
            </div>
            
            {isOnSale && (
              <p className="text-xs text-success font-medium">
                You save {formatCurrency(product.originalPrice! - product.price)}
              </p>
            )}
          </ContentPriority>
          
          {/* Social Proof */}
          {showSocialProof && (
            <div className="space-y-2">
              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-3 w-3',
                        i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              </div>
              
              {/* Sold Count */}
              {product.soldCount && product.soldCount > 0 && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-success" />
                  <span className="text-xs text-success font-medium">
                    {product.soldCount} sold
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Trust Indicators */}
          {showTrustIndicators && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <Truck className="h-3 w-3" />
                <span>Fast Delivery</span>
              </div>
              <div className="flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />
                <span>Easy Returns</span>
              </div>
            </div>
          )}
          
          {/* Add to Cart Button */}
          <MicroInteraction variant="click" intensity="strong">
            <RippleEffect color="primary" duration={600}>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={handleAddToCart}
                disabled={!product.isInStock || isAddingToCart}
                className="h-10 font-semibold"
              >
                {isAddingToCart ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Adding...</span>
                  </div>
                ) : !product.isInStock ? (
                  'Sold Out'
                ) : (
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    <span>Add to Cart</span>
                  </div>
                )}
              </Button>
            </RippleEffect>
          </MicroInteraction>
        </CardContent>
      </Card>
    </MicroInteraction>
  )
})

EnhancedProductCardComponent.displayName = 'EnhancedProductCard'

// ========================================
// Exports
// ========================================

export { EnhancedProductCardComponent as EnhancedProductCard }
export default EnhancedProductCardComponent
export type { EnhancedProductCardProps }
