/**
 * Unified Error States System
 * 
 * Provides consistent error handling patterns across the entire application.
 * Replaces multiple error implementations with a single, unified system.
 * 
 * Features:
 * - Consistent error severity levels
 * - Multiple error display variants
 * - Unified retry mechanisms
 * - Accessibility support
 * - Performance optimized
 */

import React, { memo } from 'react'
import { AlertCircle, XCircle, AlertTriangle, Info, RefreshCw, X } from 'lucide-react'
import { Button } from '@ui/Button'
import { cn } from '@utils/cn'

// ========================================
// Types & Interfaces
// ========================================

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ErrorVariant = 'inline' | 'banner' | 'modal' | 'page' | 'toast'
export type ErrorSize = 'sm' | 'md' | 'lg'

export interface ErrorConfig {
  severity?: ErrorSeverity
  variant?: ErrorVariant
  size?: ErrorSize
  title?: string
  message: string
  details?: string
  showRetry?: boolean
  showDetails?: boolean
  showClose?: boolean
  onRetry?: () => void
  onClose?: () => void
  onShowDetails?: () => void
  className?: string
}

// ========================================
// Error Configuration
// ========================================

const severityConfig: Record<ErrorSeverity, {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  borderColor: string
  textColor: string
}> = {
  low: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800'
  },
  medium: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800'
  },
  high: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-800'
  },
  critical: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800'
  }
}

const sizeConfig: Record<ErrorSize, {
  icon: string
  title: string
  message: string
  padding: string
  spacing: string
}> = {
  sm: {
    icon: 'h-4 w-4',
    title: 'text-sm font-medium',
    message: 'text-xs',
    padding: 'p-3',
    spacing: 'gap-2'
  },
  md: {
    icon: 'h-5 w-5',
    title: 'text-base font-semibold',
    message: 'text-sm',
    padding: 'p-4',
    spacing: 'gap-3'
  },
  lg: {
    icon: 'h-6 w-6',
    title: 'text-lg font-semibold',
    message: 'text-base',
    padding: 'p-6',
    spacing: 'gap-4'
  }
}

// ========================================
// Error Components
// ========================================

/**
 * Inline Error - For forms, inputs, small areas
 */
export const InlineError = memo<ErrorConfig>(({ 
  severity = 'medium',
  size = 'sm',
  title,
  message,
  details,
  showDetails = false,
  onShowDetails,
  className 
}) => {
  const config = severityConfig[severity]
  const sizeStyles = sizeConfig[size]
  const Icon = config.icon
  
  return (
    <div className={cn(
      'flex items-start',
      sizeStyles.spacing,
      className
    )}>
      <Icon className={cn(config.icon, config.color, sizeStyles.icon)} />
      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn(sizeStyles.title, config.textColor)}>{title}</p>
        )}
        <p className={cn(sizeStyles.message, config.textColor)}>{message}</p>
        {details && showDetails && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              Show details
            </summary>
            <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">
              {details}
            </pre>
          </details>
        )}
        {details && !showDetails && onShowDetails && (
          <button
            onClick={onShowDetails}
            className="mt-1 text-xs text-muted-foreground hover:text-foreground underline"
          >
            Show details
          </button>
        )}
      </div>
    </div>
  )
})

/**
 * Banner Error - For top of page, important notifications
 */
export const BannerError = memo<ErrorConfig>(({ 
  severity = 'high',
  size = 'md',
  title = 'Something went wrong',
  message,
  details,
  showRetry = true,
  showClose = true,
  onRetry,
  onClose,
  className 
}) => {
  const config = severityConfig[severity]
  const sizeStyles = sizeConfig[size]
  const Icon = config.icon
  
  return (
    <div className={cn(
      'flex items-start border-l-4',
      config.bgColor,
      config.borderColor,
      sizeStyles.padding,
      sizeStyles.spacing,
      className
    )}>
      <Icon className={cn(config.icon, config.color, sizeStyles.icon, 'flex-shrink-0 mt-0.5')} />
      <div className="flex-1 min-w-0">
        <h3 className={cn(sizeStyles.title, config.textColor)}>{title}</h3>
        <p className={cn(sizeStyles.message, config.textColor, 'mt-1')}>{message}</p>
        {details && (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Show details
            </summary>
            <pre className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
              {details}
            </pre>
          </details>
        )}
        {showRetry && onRetry && (
          <div className="mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="mr-3"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </div>
      {showClose && onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors"
          aria-label="Close error"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
})

/**
 * Modal Error - For overlay dialogs
 */
export const ModalError = memo<ErrorConfig>(({ 
  severity = 'critical',
  size = 'lg',
  title = 'Error',
  message,
  details,
  showRetry = true,
  showClose = true,
  onRetry,
  onClose,
  className 
}) => {
  const config = severityConfig[severity]
  const sizeStyles = sizeConfig[size]
  const Icon = config.icon
  
  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm',
      className
    )}>
      <div className={cn(
        'bg-background border border-border rounded-lg shadow-lg max-w-md w-full mx-4',
        sizeStyles.padding
      )}>
        <div className={cn('flex items-start', sizeStyles.spacing)}>
          <Icon className={cn(config.icon, config.color, sizeStyles.icon, 'flex-shrink-0 mt-1')} />
          <div className="flex-1 min-w-0">
            <h3 className={cn(sizeStyles.title, 'text-foreground')}>{title}</h3>
            <p className={cn(sizeStyles.message, 'text-muted-foreground mt-2')}>{message}</p>
            {details && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Show details
                </summary>
                <pre className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded">
                  {details}
                </pre>
              </details>
            )}
            <div className="flex gap-3 mt-6">
              {showRetry && onRetry && (
                <Button onClick={onRetry} variant="primary">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              {showClose && onClose && (
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

/**
 * Page Error - For full page error states
 */
export const PageError = memo<ErrorConfig>(({ 
  severity = 'critical',
  size = 'lg',
  title = 'Something went wrong',
  message,
  details,
  showRetry = true,
  showDetails = true,
  onRetry,
  onShowDetails,
  className 
}) => {
  const config = severityConfig[severity]
  const sizeStyles = sizeConfig[size]
  const Icon = config.icon
  
  return (
    <div className={cn(
      'flex flex-col items-center justify-center min-h-screen px-4 text-center',
      className
    )}>
      <div className="max-w-md w-full">
        <Icon className={cn(config.icon, config.color, 'mx-auto mb-6', sizeStyles.icon)} />
        <h1 className={cn(sizeStyles.title, 'text-foreground mb-4')}>{title}</h1>
        <p className={cn(sizeStyles.message, 'text-muted-foreground mb-6')}>{message}</p>
        
        {details && showDetails && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground mb-2">
              Show technical details
            </summary>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-4 rounded-lg overflow-auto">
              {details}
            </pre>
          </details>
        )}
        
        {details && !showDetails && onShowDetails && (
          <button
            onClick={onShowDetails}
            className="text-sm text-muted-foreground hover:text-foreground underline mb-6"
          >
            Show technical details
          </button>
        )}
        
        {showRetry && onRetry && (
          <Button onClick={onRetry} variant="primary" size="lg">
            <RefreshCw className="h-5 w-5 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  )
})

/**
 * Toast Error - For temporary notifications
 */
export const ToastError = memo<ErrorConfig>(({ 
  severity = 'medium',
  size = 'sm',
  title,
  message,
  showClose = true,
  onClose,
  className 
}) => {
  const config = severityConfig[severity]
  const sizeStyles = sizeConfig[size]
  const Icon = config.icon
  
  return (
    <div className={cn(
      'flex items-start border rounded-lg shadow-lg',
      config.bgColor,
      config.borderColor,
      sizeStyles.padding,
      sizeStyles.spacing,
      className
    )}>
      <Icon className={cn(config.icon, config.color, sizeStyles.icon, 'flex-shrink-0 mt-0.5')} />
      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn(sizeStyles.title, config.textColor)}>{title}</p>
        )}
        <p className={cn(sizeStyles.message, config.textColor)}>{message}</p>
      </div>
      {showClose && onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors"
          aria-label="Close error"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
})

// ========================================
// Main Error States Object
// ========================================

export const ErrorStates = {
  // Inline errors (forms, inputs)
  Inline: InlineError,
  
  // Banner errors (top of page)
  Banner: BannerError,
  
  // Modal errors (overlay)
  Modal: ModalError,
  
  // Page errors (full page)
  Page: PageError,
  
  // Toast errors (notifications)
  Toast: ToastError,
  
  // Quick access methods
  form: (message: string) => <InlineError message={message} severity="medium" />,
  network: (message: string, onRetry?: () => void) => (
    <BannerError message={message} severity="high" onRetry={onRetry} />
  ),
  critical: (message: string, onRetry?: () => void) => (
    <PageError message={message} severity="critical" onRetry={onRetry} />
  ),
  notification: (message: string, onClose?: () => void) => (
    <ToastError message={message} severity="medium" onClose={onClose} />
  )
} as const

// ========================================
// Exports
// ========================================

export default ErrorStates
export type { ErrorConfig, ErrorSeverity, ErrorVariant, ErrorSize }
