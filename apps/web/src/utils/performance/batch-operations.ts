/**
 * Batch Operations System - DOM manipulation optimization
 * Focus: Batch DOM operations, reduce reflows, optimize rendering
 */
import { internString } from './string-interning'

const OPACITY_TRANSITION = 'opacity'

/**
 * Batch operation queue for DOM manipulation
 */
class BatchOperationQueue {
  private operations: (() => void)[] = []
  private isProcessing = false
  private frameId: number | undefined = undefined
  
  /**
   * Add operation to batch queue
   */
  add(operation: () => void): void {
    this.operations.push(operation)
    this.schedule()
  }
  
  /**
   * Schedule batch processing
   */
  private schedule(): void {
    if (this.isProcessing || this.frameId !== undefined) return
    
    this.frameId = requestAnimationFrame(() => {
      this.process()
    })
  }
  
  /**
   * Process all batched operations
   */
  private process(): void {
    this.isProcessing = true
    this.frameId = undefined
    
    const operations = this.operations.splice(0)
    
    try {
      for (const operation of operations) {
        operation()
      }
    } catch (error: unknown) {
      console.error('Batch operation failed:', error)
    } finally {
      this.isProcessing = false
      
      // Schedule next batch if operations were added during processing
      if (this.operations.length > 0) {
        this.schedule()
      }
    }
  }
  
  /**
   * Clear all pending operations
   */
  clear(): void {
    this.operations = []
    if (this.frameId !== undefined) {
      cancelAnimationFrame(this.frameId)
      this.frameId = undefined
    }
  }
  
  /**
   * Get queue size
   */
  get size(): number {
    return this.operations.length
  }
}

/**
 * Global batch operation queue
 */
const globalBatchQueue = new BatchOperationQueue()

/**
 * Batch DOM operations for better performance
 */
export function batchDOM(operation: () => void): void {
  globalBatchQueue.add(operation)
}

/**
 * Batch element updates
 */
export function batchElementUpdates(
  elements: HTMLElement[],
  updates: (element: HTMLElement) => void
): void {
  batchDOM(() => {
    for (const element of elements) {
      updates(element)
    }
  })
}

/**
 * Batch class updates
 */
export function batchClassUpdates(
  elements: HTMLElement[],
  className: string,
  add: boolean
): void {
  batchDOM(() => {
    for (const element of elements) {
      if (add) {
        element.classList.add(className)
      } else {
        element.classList.remove(className)
      }
    }
  })
}

/**
 * Batch style updates
 */
export function batchStyleUpdates(
  elements: HTMLElement[],
  styles: Partial<CSSStyleDeclaration>
): void {
  batchDOM(() => {
    for (const element of elements) {
      Object.assign(element.style, styles)
    }
  })
}

/**
 * Batch attribute updates
 */
export function batchAttributeUpdates(
  elements: HTMLElement[],
  attributes: Record<string, string>
): void {
  batchDOM(() => {
    for (const element of elements) {
      for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value)
      }
    }
  })
}

/**
 * Optimized DOM operations with batching
 */
export class OptimizedDOMOperations {
  private static readonly elementCache = new Map<string, HTMLElement>()
  private static readonly selectorCache = new Map<string, HTMLElement[]>()
  
  /**
   * Get element with caching
   */
  static getElement(selector: string): HTMLElement | undefined {
    if (this.elementCache.has(selector)) {
      return this.elementCache.get(selector)!
    }
    
    const element = document.querySelector(selector) as HTMLElement | null
    if (element) {
      this.elementCache.set(selector, element)
    }
    
    return element || undefined
  }
  
  /**
   * Get elements with caching
   */
  static getElements(selector: string): HTMLElement[] {
    if (this.selectorCache.has(selector)) {
      return this.selectorCache.get(selector)!
    }
    
    const elements = [...document.querySelectorAll(selector)] as HTMLElement[]
    this.selectorCache.set(selector, elements)
    
    return elements
  }
  
  /**
   * Clear cache
   */
  static clearCache(): void {
    this.elementCache.clear()
    this.selectorCache.clear()
  }
  
  /**
   * Batch create elements
   */
  static batchCreateElements(
    count: number,
    tagName: string,
    parent?: HTMLElement
  ): HTMLElement[] {
    const elements: HTMLElement[] = []
    
    batchDOM(() => {
      for (let i = 0; i < count; i++) {
        const element = document.createElement(tagName)
        elements.push(element)
        
        if (parent) {
          parent.append(element)
        }
      }
    })
    
    return elements
  }
  
  /**
   * Batch remove elements
   */
  static batchRemoveElements(elements: HTMLElement[]): void {
    batchDOM(() => {
      for (const element of elements) {
        element.remove()
      }
    })
  }
  
  /**
   * Batch update text content
   */
  static batchUpdateTextContent(
    elements: HTMLElement[],
    text: string
  ): void {
    const internedText = internString(text)
    
    batchDOM(() => {
      for (const element of elements) {
        element.textContent = internedText
      }
    })
  }
  
  /**
   * Batch update inner HTML
   */
  static batchUpdateInnerHTML(
    elements: HTMLElement[],
    html: string
  ): void {
    const internedHTML = internString(html)
    
    batchDOM(() => {
      for (const element of elements) {
        element.innerHTML = internedHTML
      }
    })
  }
}

/**
 * Optimized event handling with batching
 */
export class OptimizedEventHandling {
  private static readonly eventListeners = new Map<string, Map<HTMLElement, (event: Event) => void>>()
  
  /**
   * Add event listener with batching
   */
  static addEventListener(
    element: HTMLElement,
    event: string,
    handler: (event: Event) => void,
    options?: AddEventListenerOptions
  ): void {
    const key = `${event}-${element.tagName}-${element.className}`
    
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, new Map())
    }
    
    this.eventListeners.get(key)!.set(element, handler)
    
    element.addEventListener(event, handler, options)
  }
  
  /**
   * Remove event listener
   */
  static removeEventListener(
    element: HTMLElement,
    event: string,
    handler: (event: Event) => void
  ): void {
    const key = `${event}-${element.tagName}-${element.className}`
    const listeners = this.eventListeners.get(key)
    
    if (listeners) {
      listeners.delete(element)
      if (listeners.size === 0) {
        this.eventListeners.delete(key)
      }
    }
    
    element.removeEventListener(event, handler)
  }
  
  /**
   * Batch add event listeners
   */
  static batchAddEventListeners(
    elements: HTMLElement[],
    event: string,
    handler: (event: Event) => void,
    options?: AddEventListenerOptions
  ): void {
    batchDOM(() => {
      for (const element of elements) {
        this.addEventListener(element, event, handler, options)
      }
    })
  }
  
  /**
   * Clear all event listeners
   */
  static clearAllEventListeners(): void {
    for (const [key, listeners] of this.eventListeners.entries()) {
      for (const [element, handler] of listeners.entries()) {
        const event = key.split('-')[0]
        element.removeEventListener(event as keyof HTMLElementEventMap, handler as EventListener)
      }
    }
    this.eventListeners.clear()
  }
}

/**
 * Optimized animation with batching
 */
export class OptimizedAnimation {
  private static animationQueue: (() => void)[] = []
  private static isAnimating = false
  
  /**
   * Batch animations
   */
  static batchAnimate(
    elements: HTMLElement[],
    animation: (element: HTMLElement) => void,
    duration = 300
  ): void {
    this.animationQueue.push(() => {
      for (const element of elements) {
        animation(element)
      }
    })
    
    if (!this.isAnimating) {
      this.startAnimation(duration)
    }
  }
  
  /**
   * Start animation batch
   */
  private static startAnimation(duration: number): void {
    this.isAnimating = true
    
    const startTime = performance.now()
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      for (const animation of this.animationQueue) {
        animation()
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        this.isAnimating = false
        this.animationQueue = []
      }
    }
    
    requestAnimationFrame(animate)
  }
  
  /**
   * Fade in animation
   */
  static fadeIn(elements: HTMLElement[], duration = 300): void {
    this.batchAnimate(elements, (element) => {
      element.style.opacity = '0'
      element.style.transition = `${OPACITY_TRANSITION} ${duration}ms ease-in-out`
      element.style.opacity = '1'
    }, duration)
  }
  
  /**
   * Fade out animation
   */
  static fadeOut(elements: HTMLElement[], duration = 300): void {
    this.batchAnimate(elements, (element) => {
      element.style.opacity = '1'
      element.style.transition = `${OPACITY_TRANSITION} ${duration}ms ease-in-out`
      element.style.opacity = '0'
    }, duration)
  }
  
  /**
   * Slide in animation
   */
  static slideIn(elements: HTMLElement[], duration = 300): void {
    this.batchAnimate(elements, (element) => {
      element.style.transform = 'translateY(-100%)'
      element.style.transition = 'transform ' + duration + 'ms ease-in-out'
      element.style.transform = 'translateY(0)'
    }, duration)
  }
  
  /**
   * Slide out animation
   */
  static slideOut(elements: HTMLElement[], duration = 300): void {
    this.batchAnimate(elements, (element) => {
      element.style.transform = 'translateY(0)'
      element.style.transition = 'transform ' + duration + 'ms ease-in-out'
      element.style.transform = 'translateY(-100%)'
    }, duration)
  }
}

/**
 * Performance monitoring for batch operations
 */
export class BatchPerformanceMonitor {
  private static metrics = {
    totalOperations: 0,
    totalTime: 0,
    averageTime: 0,
    maxTime: 0,
    minTime: Infinity
  }
  
  /**
   * Track batch operation performance
   */
  static track<T>(operation: () => T): T {
    const startTime = performance.now()
    const result = operation()
    const endTime = performance.now()
    
    const duration = endTime - startTime
    
    this.metrics.totalOperations++
    this.metrics.totalTime += duration
    this.metrics.averageTime = this.metrics.totalTime / this.metrics.totalOperations
    this.metrics.maxTime = Math.max(this.metrics.maxTime, duration)
    this.metrics.minTime = Math.min(this.metrics.minTime, duration)
    
    return result
  }
  
  /**
   * Get performance metrics
   */
  static getMetrics(): typeof this.metrics {
    return { ...this.metrics }
  }
  
  /**
   * Clear metrics
   */
  static clearMetrics(): void {
    this.metrics = {
      totalOperations: 0,
      totalTime: 0,
      averageTime: 0,
      maxTime: 0,
      minTime: Infinity
    }
  }
}
