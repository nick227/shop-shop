/**
 * ErrorBoundary - Catches React errors and prevents app crashes
 */
import type { ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'
import { reportUiError } from '@shared/lib/clientErrorReporting'

interface Props {
  readonly children: ReactNode
  readonly fallback?: ReactNode
}

interface State {
  readonly hasError: boolean
  readonly error: Error | undefined
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
    reportUiError(error, errorInfo, 'ErrorBoundary')
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    globalThis.location.href = '/'
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
            type="button"
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
