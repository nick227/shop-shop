/**
 * MicroInteractions - Delightful User Experience Components
 * 
 * Provides engaging micro-interactions and delightful animations
 * to enhance user experience and create emotional connections.
 * 
 * Features:
 * - Delightful hover and focus states
 * - Engaging loading animations
 * - Smooth transitions and feedback
 * - Performance optimized animations
 * - Accessibility compliant interactions
 */

import React, { memo, useCallback, useState, useEffect } from 'react'
import { cn } from '@utils/cn'

// ========================================
// Types & Interfaces
// ========================================

export interface MicroInteractionProps {
  children: React.ReactNode
  variant?: 'hover' | 'focus' | 'click' | 'load' | 'success' | 'error'
  intensity?: 'subtle' | 'medium' | 'strong'
  duration?: 'fast' | 'normal' | 'slow'
  disabled?: boolean
  className?: string
}

export interface RippleEffectProps {
  children: React.ReactNode
  color?: 'primary' | 'secondary' | 'accent'
  duration?: number
  disabled?: boolean
  className?: string
}

export interface PulseAnimationProps {
  children: React.ReactNode
  intensity?: 'subtle' | 'medium' | 'strong'
  duration?: number
  disabled?: boolean
  className?: string
}

export interface ShakeAnimationProps {
  children: React.ReactNode
  intensity?: 'subtle' | 'medium' | 'strong'
  duration?: number
  disabled?: boolean
  className?: string
}

export interface BounceAnimationProps {
  children: React.ReactNode
  intensity?: 'subtle' | 'medium' | 'strong'
  duration?: number
  disabled?: boolean
  className?: string
}

export interface GlowEffectProps {
  children: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'error'
  intensity?: 'subtle' | 'medium' | 'strong'
  duration?: number
  disabled?: boolean
  className?: string
}

// ========================================
// MicroInteraction Component
// ========================================

const MicroInteractionComponent = memo<MicroInteractionProps>(({
  children,
  variant = 'hover',
  intensity = 'medium',
  duration = 'normal',
  disabled = false,
  className
}) => {
  const [isActive, setIsActive] = useState(false)
  
  const handleMouseEnter = useCallback(() => {
    if (!disabled) setIsActive(true)
  }, [disabled])
  
  const handleMouseLeave = useCallback(() => {
    if (!disabled) setIsActive(false)
  }, [disabled])
  
  const handleFocus = useCallback(() => {
    if (!disabled) setIsActive(true)
  }, [disabled])
  
  const handleBlur = useCallback(() => {
    if (!disabled) setIsActive(false)
  }, [disabled])
  
  const handleClick = useCallback(() => {
    if (!disabled) {
      setIsActive(true)
      setTimeout(() => setIsActive(false), 200)
    }
  }, [disabled])
  
  const interactionClasses = cn(
    'transition-all duration-normal ease-out',
    {
      // Hover variants
      'hover:scale-105 hover:shadow-lg': variant === 'hover' && intensity === 'strong',
      'hover:scale-102 hover:shadow-md': variant === 'hover' && intensity === 'medium',
      'hover:scale-101 hover:shadow-sm': variant === 'hover' && intensity === 'subtle',
      
      // Focus variants
      'focus:ring-2 focus:ring-primary focus:ring-offset-2': variant === 'focus' && intensity === 'strong',
      'focus:ring-1 focus:ring-primary focus:ring-offset-1': variant === 'focus' && intensity === 'medium',
      'focus:ring-1 focus:ring-primary/50': variant === 'focus' && intensity === 'subtle',
      
      // Click variants
      'active:scale-95 active:shadow-sm': variant === 'click' && intensity === 'strong',
      'active:scale-98 active:shadow-xs': variant === 'click' && intensity === 'medium',
      'active:scale-99': variant === 'click' && intensity === 'subtle',
      
      // Load variants
      'animate-pulse': variant === 'load' && isActive,
      'animate-bounce': variant === 'load' && intensity === 'strong' && isActive,
      
      // Success variants
      'animate-bounce-in': variant === 'success' && isActive,
      'bg-success/10 border-success/20': variant === 'success' && isActive,
      
      // Error variants
      'animate-shake': variant === 'error' && isActive,
      'bg-destructive/10 border-destructive/20': variant === 'error' && isActive,
    },
    {
      'duration-fast': duration === 'fast',
      'duration-normal': duration === 'normal',
      'duration-slow': duration === 'slow',
    },
    className
  )
  
  return (
    <div
      className={interactionClasses}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
    >
      {children}
    </div>
  )
})

MicroInteractionComponent.displayName = 'MicroInteraction'

// ========================================
// RippleEffect Component
// ========================================

const RippleEffectComponent = memo<RippleEffectProps>(({
  children,
  color = 'primary',
  duration = 600,
  disabled = false,
  className
}) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])
  
  const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return
    
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    const newRipple = {
      id: Date.now(),
      x,
      y
    }
    
    setRipples(prev => [...prev, newRipple])
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
    }, duration)
  }, [disabled, duration])
  
  const rippleClasses = cn(
    'relative overflow-hidden',
    className
  )
  
  const rippleColorClasses = {
    primary: 'bg-primary/20',
    secondary: 'bg-secondary/20',
    accent: 'bg-accent/20'
  }
  
  return (
    <div className={rippleClasses} onClick={handleClick}>
      {children}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className={cn(
            'absolute pointer-events-none rounded-full animate-ping',
            rippleColorClasses[color]
          )}
          style={{
            left: ripple.x - 20,
            top: ripple.y - 20,
            width: 40,
            height: 40,
            animationDuration: `${duration}ms`
          }}
        />
      ))}
    </div>
  )
})

RippleEffectComponent.displayName = 'RippleEffect'

// ========================================
// PulseAnimation Component
// ========================================

const PulseAnimationComponent = memo<PulseAnimationProps>(({
  children,
  intensity = 'medium',
  duration = 1000,
  disabled = false,
  className
}) => {
  const [isPulsing, setIsPulsing] = useState(false)
  
  useEffect(() => {
    if (disabled) return
    
    const interval = setInterval(() => {
      setIsPulsing(true)
      setTimeout(() => setIsPulsing(false), duration / 2)
    }, duration)
    
    return () => clearInterval(interval)
  }, [disabled, duration])
  
  const pulseClasses = cn(
    'transition-all duration-normal',
    {
      'animate-pulse': isPulsing && intensity === 'subtle',
      'animate-bounce': isPulsing && intensity === 'medium',
      'animate-ping': isPulsing && intensity === 'strong',
    },
    className
  )
  
  return (
    <div className={pulseClasses}>
      {children}
    </div>
  )
})

PulseAnimationComponent.displayName = 'PulseAnimation'

// ========================================
// ShakeAnimation Component
// ========================================

const ShakeAnimationComponent = memo<ShakeAnimationProps>(({
  children,
  intensity = 'medium',
  duration = 500,
  disabled = false,
  className
}) => {
  const [isShaking, setIsShaking] = useState(false)
  
  const triggerShake = useCallback(() => {
    if (disabled) return
    
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), duration)
  }, [disabled, duration])
  
  const shakeClasses = cn(
    'transition-transform duration-fast',
    {
      'animate-shake': isShaking,
    },
    className
  )
  
  return (
    <div className={shakeClasses} onClick={triggerShake}>
      {children}
    </div>
  )
})

ShakeAnimationComponent.displayName = 'ShakeAnimation'

// ========================================
// BounceAnimation Component
// ========================================

const BounceAnimationComponent = memo<BounceAnimationProps>(({
  children,
  intensity = 'medium',
  duration = 500,
  disabled = false,
  className
}) => {
  const [isBouncing, setIsBouncing] = useState(false)
  
  const triggerBounce = useCallback(() => {
    if (disabled) return
    
    setIsBouncing(true)
    setTimeout(() => setIsBouncing(false), duration)
  }, [disabled, duration])
  
  const bounceClasses = cn(
    'transition-transform duration-normal',
    {
      'animate-bounce-in': isBouncing && intensity === 'strong',
      'animate-bounce': isBouncing && intensity === 'medium',
      'animate-pulse': isBouncing && intensity === 'subtle',
    },
    className
  )
  
  return (
    <div className={bounceClasses} onClick={triggerBounce}>
      {children}
    </div>
  )
})

BounceAnimationComponent.displayName = 'BounceAnimation'

// ========================================
// GlowEffect Component
// ========================================

const GlowEffectComponent = memo<GlowEffectProps>(({
  children,
  color = 'primary',
  intensity = 'medium',
  duration = 2000,
  disabled = false,
  className
}) => {
  const [isGlowing, setIsGlowing] = useState(false)
  
  useEffect(() => {
    if (disabled) return
    
    const interval = setInterval(() => {
      setIsGlowing(true)
      setTimeout(() => setIsGlowing(false), duration / 2)
    }, duration)
    
    return () => clearInterval(interval)
  }, [disabled, duration])
  
  const glowClasses = cn(
    'transition-all duration-normal',
    {
      'shadow-primary': isGlowing && color === 'primary' && intensity === 'strong',
      'shadow-success': isGlowing && color === 'success' && intensity === 'strong',
      'shadow-warning': isGlowing && color === 'warning' && intensity === 'strong',
      'shadow-destructive': isGlowing && color === 'error' && intensity === 'strong',
      'shadow-lg': isGlowing && intensity === 'medium',
      'shadow-md': isGlowing && intensity === 'subtle',
    },
    className
  )
  
  return (
    <div className={glowClasses}>
      {children}
    </div>
  )
})

GlowEffectComponent.displayName = 'GlowEffect'

// ========================================
// Exports
// ========================================

export { MicroInteractionComponent as MicroInteraction }
export { RippleEffectComponent as RippleEffect }
export { PulseAnimationComponent as PulseAnimation }
export { ShakeAnimationComponent as ShakeAnimation }
export { BounceAnimationComponent as BounceAnimation }
export { GlowEffectComponent as GlowEffect }

export default MicroInteractionComponent
export type { 
  MicroInteractionProps, 
  RippleEffectProps, 
  PulseAnimationProps, 
  ShakeAnimationProps, 
  BounceAnimationProps, 
  GlowEffectProps 
}
