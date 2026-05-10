import { useState, useEffect } from 'react'

export interface StoreDeliveryOption {
  deliveryMode: string
  enabled: boolean
  feeDisclosure: string
  externalInfoUrl: string | null
  sortOrder: number
}

export interface StoreDeliveryOptionsResponse {
  storeId: string
  deliveryOptions: StoreDeliveryOption[]
}

export function useStoreDeliveryOptions(storeId: string) {
  const [data, setData] = useState<StoreDeliveryOptionsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDeliveryOptions = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/stores/${storeId}/delivery-options`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch delivery options: ${response.status}`)
        }
        
        const options = await response.json()
        setData(options)
      } catch (err) {
        console.error('Error fetching store delivery options:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    if (storeId) {
      fetchDeliveryOptions()
    }
  }, [storeId])

  return { data, loading, error }
}
