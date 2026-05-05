/**
 * Cart Animation Utilities - Micro-interactions for cart components
 */

export interface CartAnimationConfig {
  duration?: number
  easing?: string
  scale?: number
  bounce?: boolean
}

export const defaultAnimationConfig: CartAnimationConfig = {
  duration: 300,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  scale: 1.1,
  bounce: true
}

/**
 * Cart badge animation classes
 */
export const cartBadgeAnimations = {
  // Bounce effect when item is added
  bounce: 'animate-bounce',
  
  // Scale effect for cart updates
  scaleUp: 'transform scale-125 transition-transform duration-300',
  
  // Pulse effect for attention
  pulse: 'animate-pulse',
  
  // Shake effect for errors
  shake: 'animate-shake',
  
  // Smooth transition for count changes
  smooth: 'transition-all duration-300 ease-in-out'
}

/**
 * Cart item animation classes
 */
export const cartItemAnimations = {
  // Slide in for new items
  slideIn: 'animate-slide-in-right',
  
  // Fade out for removed items
  fadeOut: 'animate-fade-out',
  
  // Highlight for quantity changes
  highlight: 'bg-yellow-50 border-yellow-200 transition-colors duration-200',
  
  // Loading state
  loading: 'opacity-50 pointer-events-none'
}

/**
 * Button animation states
 */
export const buttonAnimations = {
  // Success state
  success: 'bg-green-500 text-white transform scale-105 transition-all duration-200',
  
  // Loading state
  loading: 'opacity-75 cursor-not-allowed',
  
  // Hover state
  hover: 'hover:scale-105 transition-transform duration-200',
  
  // Active state
  active: 'active:scale-95 transition-transform duration-100'
}

/**
 * CSS animation keyframes (to be added to global styles)
 */
export const animationKeyframes = `
  @keyframes slide-in-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes fade-out {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.95);
    }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }

  @keyframes bounce-gentle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  .animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out;
  }

  .animate-fade-out {
    animation: fade-out 0.2s ease-in;
  }

  .animate-shake {
    animation: shake 0.3s ease-in-out;
  }

  .animate-bounce-gentle {
    animation: bounce-gentle 0.6s ease-in-out;
  }

  .tap-scale {
    transition: transform 0.1s ease-in-out;
  }

  .tap-scale:active {
    transform: scale(0.95);
  }
`

/**
 * Animation utility functions
 */
export class CartAnimationUtils {
  /**
   * Trigger a bounce animation on cart badge
   */
  static triggerCartBadgeBounce(element: HTMLElement): void {
    element.classList.add('animate-bounce-gentle')
    setTimeout(() => {
      element.classList.remove('animate-bounce-gentle')
    }, 600)
  }

  /**
   * Trigger a scale animation for cart updates
   */
  static triggerScaleAnimation(element: HTMLElement, scale: number = 1.1): void {
    element.style.transform = `scale(${scale})`
    element.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    
    setTimeout(() => {
      element.style.transform = 'scale(1)'
    }, 300)
  }

  /**
   * Animate number changes (like cart count)
   */
  static animateNumberChange(
    element: HTMLElement, 
    from: number, 
    to: number, 
    duration: number = 300
  ): void {
    const startTime = Date.now()
    const difference = to - from

    const updateNumber = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(from + (difference * easeOut))
      
      element.textContent = current.toString()
      
      if (progress < 1) {
        requestAnimationFrame(updateNumber)
      }
    }

    requestAnimationFrame(updateNumber)
  }

  /**
   * Create ripple effect on button clicks
   */
  static createRipple(event: React.MouseEvent, button: HTMLElement): void {
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    const ripple = document.createElement('span')
    ripple.className = 'absolute bg-white opacity-30 rounded-full pointer-events-none'
    ripple.style.width = ripple.style.height = size + 'px'
    ripple.style.left = x + 'px'
    ripple.style.top = y + 'px'
    ripple.style.transform = 'scale(0)'
    ripple.style.animation = 'ripple 0.6s linear'

    button.style.position = 'relative'
    button.style.overflow = 'hidden'
    button.appendChild(ripple)

    setTimeout(() => {
      ripple.remove()
    }, 600)
  }
}

/**
 * React hook for cart animations
 */
export function useCartAnimations() {
  const triggerBadgeAnimation = (elementRef: React.RefObject<HTMLElement>) => {
    if (elementRef.current) {
      CartAnimationUtils.triggerCartBadgeBounce(elementRef.current)
    }
  }

  const triggerScaleAnimation = (elementRef: React.RefObject<HTMLElement>, scale?: number) => {
    if (elementRef.current) {
      CartAnimationUtils.triggerScaleAnimation(elementRef.current, scale)
    }
  }

  return {
    triggerBadgeAnimation,
    triggerScaleAnimation,
    animateNumberChange: CartAnimationUtils.animateNumberChange,
    createRipple: CartAnimationUtils.createRipple,
    animations: {
      badge: cartBadgeAnimations,
      item: cartItemAnimations,
      button: buttonAnimations
    }
  }
}
