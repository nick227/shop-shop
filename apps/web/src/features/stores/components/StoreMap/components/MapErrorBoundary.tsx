/**
 * MapErrorBoundary - Error boundary for map components
 * Single Responsibility: Error handling for map components
 */
import type { ReactNode } from 'react';
import { Component } from 'react'

export interface MapErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: any) => void
}

export interface MapErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  constructor(props: MapErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: any) {
    console.error('Map component error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="h-[400px] bg-gray-200 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <p className="text-gray-600 mb-2">Map failed to load</p>
            <button 
              className="text-blue-600 hover:text-blue-800"
              onClick={() => this.setState({ hasError: false })}
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
