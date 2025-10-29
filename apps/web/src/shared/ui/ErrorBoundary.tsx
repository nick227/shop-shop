/**
 * ErrorBoundary - Catches React errors and prevents app crashes
 */
import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | undefined
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: undefined }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service (Sentry, etc.)
    if (import.meta.env.PROD) {
      console.error('React Error:', error, errorInfo)
      // TODO: Send to error reporting service
      // Sentry.captureException(error, { extra: errorInfo })
    } else {
      console.error('React Error:', error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    window.location.href = '/'
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          role="alert"
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: '#f8fafc',
          }}
        >
          <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '1rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>
            We're sorry for the inconvenience. Please try refreshing the page.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Go to Home
          </button>
        </div>
      )
    }

    return this.props.children
  }
}


