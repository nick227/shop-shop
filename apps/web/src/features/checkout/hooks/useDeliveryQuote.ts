import { useState, useCallback } from 'react'

export interface DeliveryQuote {
  feeCents: number
  currency: string
  etaMinutes?: number
  providerPayload?: unknown
}

export interface DeliveryQuoteRequest {
  orderId: string
  storeId: string
  provider: string
  dropoffLatitude: number
  dropoffLongitude: number
}

export interface DeliveryQuoteResponse {
  success: boolean
  provider: string
  quote: DeliveryQuote
}

export interface MultipleQuotesResponse {
  success: boolean
  orderId: string
  storeId: string
  quotes: Array<{
    provider: string
    feeCents: number
    currency: string
    etaMinutes?: number
    available: boolean
    error?: string
  }>
}

export function useDeliveryQuote() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getQuote = useCallback(async (request: DeliveryQuoteRequest): Promise<DeliveryQuoteResponse | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/delivery/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to get quote: ${response.status}`)
      }

      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Delivery quote error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getAllQuotes = useCallback(async (request: Omit<DeliveryQuoteRequest, 'provider'>): Promise<MultipleQuotesResponse | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/delivery/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to get quotes: ${response.status}`)
      }

      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Multiple delivery quotes error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    getQuote,
    getAllQuotes,
    loading,
    error,
    clearError: () => setError(null),
  }
}
