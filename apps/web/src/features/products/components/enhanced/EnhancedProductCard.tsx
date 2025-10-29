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
import { Button, Badge, Image, Card, CardContent, CardHeader, CardTitle } from '@shared/ui/primitives'
import { MicroInteraction, RippleEffect, PulseAnimation } from '@shared/ui/primitives/Enhancements/MicroInteractions'
import { VisualCue, ContentPriority } from '@shared/ui/primitives/Enhancements/VisualHierarchy'
import { cn } from '@shared/lib/cn'
import { formatCurrency } from '@shared/lib/format'

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
  onProductClick?: (productId: string) => void
  variant?: 'default' | 'compact' | 'detailed' | 'featured'
  showWishlist?: boolean
  showQuickView?: boolean
  showCompare?: boolean
  showStockStatus?: boolean
  showSocialProof?: boolean
  className?: string
}

// ========================================
// Enhanced Product Card Component
// ========================================

export const EnhancedProductCard = memo<EnhancedProductCardProps>(({
  product,
  onAddToCart,
  onAddToWishlist,
  onQuickView,
  onCompare,
  onProductClick,
  variant = 'default',
  showWishlist = true,
  showQuickView = true,
  showCompare = true,
  showStockStatus = true,
  showSocialProof = true,
  className
}) => {
  // ========================================
  // State Management
  // ========================================
  
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  // ========================================
  // Computed Values
  // ========================================
  
  const savings = useMemo(() => {
    if (product.originalPrice && product.originalPrice > product.price) {
      return product.originalPrice - product.price
    }
    return 0
  }, [product.originalPrice, product.price])

  const savingsPercentage = useMemo(() => {
    if (product.originalPrice && product.originalPrice > product.price) {
      return Math.round((savings / product.originalPrice) * 100)
    }
    return 0
  }, [savings, product.originalPrice])

  const stockStatus = useMemo(() => {
    if (!product.isInStock) return { status: 'out-of-stock', label: 'Out of Stock', color: 'red' }
    if (product.stockCount && product.stockCount < 10) return { status: 'low-stock', label: 'Only few left', color: 'orange' }
    return { status: 'in-stock', label: 'In Stock', color: 'green' }
  }, [product.isInStock, product.stockCount])

  const currentImage = useMemo(() => {
    if (product.images && product.images.length > 0) {
      return product.images[currentImageIndex] || product.image
    }
    return product.image
  }, [product.images, product.image, currentImageIndex])

  // ========================================
  // Event Handlers
  // ========================================
  
  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!onAddToCart || !product.isInStock) return
    
    setIsAddingToCart(true)
    try {
      await onAddToCart(product.id, 1)
    } finally {
      setIsAddingToCart(false)
    }
  }, [onAddToCart, product.id, product.isInStock])

  const handleWishlistToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (onAddToWishlist) {
      setIsWishlisted(!isWishlisted)
      onAddToWishlist(product.id)
    }
  }, [onAddToWishlist, product.id, isWishlisted])

  const handleQuickView = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onQuickView?.(product.id)
  }, [onQuickView, product.id])

  const handleCompare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onCompare?.(product.id)
  }, [onCompare, product.id])

  const handleProductClick = useCallback(() => {
    onProductClick?.(product.id)
  }, [onProductClick, product.id])

  const handleImageHover = useCallback((index: number) => {
    setCurrentImageIndex(index)
  }, [])

  // ========================================
  // Render Helpers
  // ========================================
  
  const renderBadges = () => (
    <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
      {product.isOnSale && (
        <Badge variant="destructive" className="text-xs font-bold">
          {savingsPercentage}% OFF
        </Badge>
      )}
      {product.isNew && (
        <Badge variant="secondary" className="text-xs font-bold">
          NEW
        </Badge>
      )}
      {product.isLimited && (
        <Badge variant="outline" className="text-xs font-bold border-orange-500 text-orange-600">
          LIMITED
        </Badge>
      )}
      {product.isFeatured && (
        <Badge variant="default" className="text-xs font-bold bg-blue-600">
          FEATURED
        </Badge>
      )}
    </div>
  )

  const renderActionButtons = () => (
    <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      {showWishlist && (
        <MicroInteraction>
          <Button
            size="sm"
            variant="outline"
            onClick={handleWishlistToggle}
            className={cn(
              "w-8 h-8 p-0 rounded-full bg-white/90 backdrop-blur-sm",
              isWishlisted && "text-red-500 border-red-500"
            )}
          >
            <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
          </Button>
        </MicroInteraction>
      )}
      
      {showQuickView && (
        <MicroInteraction>
          <Button
            size="sm"
            variant="outline"
            onClick={handleQuickView}
            className="w-8 h-8 p-0 rounded-full bg-white/90 backdrop-blur-sm"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </MicroInteraction>
      )}
      
      {showCompare && (
        <MicroInteraction>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCompare}
            className="w-8 h-8 p-0 rounded-full bg-white/90 backdrop-blur-sm"
          >
            <TrendingUp className="w-4 h-4" />
          </Button>
        </MicroInteraction>
      )}
    </div>
  )

  const renderImageGallery = () => (
    <div className="relative">
      <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={currentImage}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onLoad={() => setIsHovered(true)}
        />
      </div>
      
      {/* Image Thumbnails */}
      {product.images && product.images.length > 1 && (
        <div className="absolute bottom-2 left-2 right-2 flex gap-1 justify-center">
          {product.images.slice(0, 4).map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={cn(
                "w-6 h-6 rounded border-2 transition-all",
                currentImageIndex === index
                  ? "border-blue-500 scale-110"
                  : "border-white/50 hover:border-white"
              )}
            >
              <img
                src={image}
                alt={`${product.title} ${index + 1}`}
                className="w-full h-full object-cover rounded"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const renderProductInfo = () => (
    <div className="space-y-2">
      {/* Brand */}
      {product.brand && (
        <p className="text-xs text-gray-500 uppercase tracking-wide">{product.brand}</p>
      )}
      
      {/* Title */}
      <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
        {product.title}
      </h3>
      
      {/* Category */}
      <p className="text-sm text-gray-600">{product.category}</p>
      
      {/* Rating & Reviews */}
      {showSocialProof && (
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-4 h-4",
                  i < Math.floor(product.rating)
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300"
                )}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {product.rating} ({product.reviewCount} reviews)
          </span>
        </div>
      )}
      
      {/* Price */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-gray-900">
          {formatCurrency(product.price)}
        </span>
        {product.originalPrice && product.originalPrice > product.price && (
          <>
            <span className="text-sm text-gray-500 line-through">
              {formatCurrency(product.originalPrice)}
            </span>
            <Badge variant="destructive" className="text-xs">
              Save {formatCurrency(savings)}
            </Badge>
          </>
        )}
      </div>
      
      {/* Stock Status */}
      {showStockStatus && (
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            stockStatus.color === 'green' && "bg-green-500",
            stockStatus.color === 'orange' && "bg-orange-500",
            stockStatus.color === 'red' && "bg-red-500"
          )} />
          <span className="text-sm text-gray-600">{stockStatus.label}</span>
        </div>
      )}
      
      {/* Social Proof */}
      {showSocialProof && product.soldCount && (
        <p className="text-xs text-gray-500">
          {product.soldCount.toLocaleString()} sold
        </p>
      )}
    </div>
  )

  const renderActionFooter = () => (
    <div className="pt-4 border-t border-gray-100">
      <div className="flex items-center gap-2">
        <Button
          onClick={handleAddToCart}
          disabled={!product.isInStock || isAddingToCart}
          className="flex-1"
          size="sm"
        >
          {isAddingToCart ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Adding...
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-2" />
              {product.isInStock ? 'Add to Cart' : 'Out of Stock'}
            </>
          )}
        </Button>
        
        {product.isInStock && (
          <MicroInteraction>
            <Button
              variant="outline"
              size="sm"
              onClick={handleWishlistToggle}
              className={cn(
                "px-3",
                isWishlisted && "text-red-500 border-red-500"
              )}
            >
              <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
            </Button>
          </MicroInteraction>
        )}
      </div>
    </div>
  )

  // ========================================
  // Render
  // ========================================
  
  const cardVariants = {
    default: "w-full",
    compact: "w-64",
    detailed: "w-80",
    featured: "w-full max-w-sm"
  }

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-lg",
        cardVariants[variant],
        className
      )}
      onClick={handleProductClick}
    >
      <CardContent className="p-0">
        {/* Image Section */}
        <div className="relative">
          {renderImageGallery()}
          {renderBadges()}
          {renderActionButtons()}
        </div>

        {/* Content Section */}
        <div className="p-4">
          {renderProductInfo()}
          {variant !== 'compact' && renderActionFooter()}
        </div>
      </CardContent>
    </Card>
  )
})

EnhancedProductCard.displayName = 'EnhancedProductCard'
