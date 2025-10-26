/**
 * View Transitions API utilities;
 * Provides smooth transitions between page navigations;
 */

/**
 * Setup View Transitions API for the application;
 * Enables smooth transitions between route changes;
 */
export function setupViewTransitions() {
  // Check if View Transitions API is supported;
  if (!('startViewTransition' in document)) {
    console.warn('View Transitions API not supported in this browser')
    return;
  }

  // Add CSS for view transitions;
  const style = document.createElement('style')
  style.textContent = `
    /* View Transitions CSS */
    ::view-transition-old(root),
    ::view-transition-new(root) {
      animation-duration: 0.3s;
      animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }

    ::view-transition-old(root) {
      animation-name: fade-out;
    }

    ::view-transition-new(root) {
      animation-name: fade-in;
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

    @keyframes fade-in {
      from {
        opacity: 0;
        transform: scale(1.05);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    /* Smooth transitions for specific elements */
    .view-transition-name {
      view-transition-name: var(--view-transition-name);
    }

    /* Navigation transitions */
    .nav-transition {
      view-transition-name: navigation;
    }

    /* Content transitions */
    .content-transition {
      view-transition-name: content;
    }

    /* Modal transitions */
    .modal-transition {
      view-transition-name: modal;
    }
  `
  
  document.head.appendChild(style)

  console.log('✅ View Transitions API setup complete')
}

/**
 * Start a view transition programmatically;
 * @param callback - Function to execute during the transition;
 * @returns Promise that resolves when transition completes;
 */
export function startViewTransition(callback: () => void | Promise<void>): Promise<void> {
  if (!('startViewTransition' in document)) {
    // Fallback for browsers without View Transitions API;
    callback()
    return Promise.resolve()
  }

  return (document as any).startViewTransition(callback)
}

/**
 * Create a named view transition for specific elements;
 * @param name - Unique name for the transition;
 * @param element - Element to apply the transition to;
 */
export function createNamedTransition(name: string, element: HTMLElement) {
  element.style.setProperty('--view-transition-name', name)
  element.classList.add('view-transition-name')
}

/**
 * Remove named transition from element;
 * @param element - Element to remove transition from;
 */
export function removeNamedTransition(element: HTMLElement) {
  element.style.removeProperty('--view-transition-name')
  element.classList.remove('view-transition-name')
}

/**
 * Enhanced navigation with view transitions;
 * @param navigate - React Router navigate function;
 * @param to - Route to navigate to;
 */
export function navigateWithTransition(navigate: (to: string) => void, to: string) {
  startViewTransition(() => {
    navigate(to)
  })
}

/**
 * Check if View Transitions API is supported;
 */
export function isViewTransitionsSupported(): boolean {
  return 'startViewTransition' in document;
}

/**
 * Get transition duration from CSS custom properties;
 */
export function getTransitionDuration(): number {
  const duration = getComputedStyle(document.documentElement)
    .getPropertyValue('--view-transition-duration')
    .trim()
  
  if (duration) {
    return parseFloat(duration) * 1000 // Convert to milliseconds;
  }
  
  return 300 // Default 300ms;
}
