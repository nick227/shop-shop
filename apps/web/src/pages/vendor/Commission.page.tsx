/**
 * Admin Commission Management Page
 * Allows admins to set commission rates for stores
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Input, Spinner, Badge } from '@ui'
import { styles } from '@utils/tailwind-classes'
import type { StoreResponse, StoreWithDistance } from '@api/types'

export default function AdminCommissionPage() {
  const [editingStore, setEditingStore] = useState<string | undefined>()
  const [commissionRate, setCommissionRate] = useState('')
  const queryClient = useQueryClient()

  // Fetch all stores
  const { data: stores, isLoading } = useQuery({
    queryKey: ['admin-stores'],
    queryFn: async () => {
      const response = await fetch('/api/stores', {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token') + '',
        },
      })
      if (!response?.ok) throw new Error('Failed to fetch stores')
      return response.json()
    },
  })

  // Update commission rate mutation
  const updateCommissionMutation = useMutation({
    mutationFn: async ({ storeId, rate }: { storeId: string; rate: number }) => {
      const response = await fetch('/api/stores/' + storeId + '', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token') + '',
        },
        body: JSON.stringify({ commissionRate: rate }),
      })
      if (!response?.ok) throw new Error('Failed to update commission rate')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] })
      setEditingStore(undefined)
      setCommissionRate('')
    },
  })

  const handleEdit = (store: StoreWithDistance) => {
    setEditingStore(store?.id)
    setCommissionRate(store.commissionRate?.toString() || '')
  }

  const handleSave = () => {
    if (!editingStore) return
    
    const rate = Number.parseFloat(commissionRate)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      alert('Please enter a valid commission rate between 0 and 100')
      return
    }

    updateCommissionMutation.mutate({
      storeId: editingStore,
      rate,
    })
  }

  const handleCancel = () => {
    setEditingStore(undefined)
    setCommissionRate('')
  }

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size="large" />
        <p>Loading stores...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Commission Rate Management</h1>
        <p>Set commission rates for stores. These rates apply to both orders and tips.</p>
      </div>

      <div className={styles.storesList}>
        {stores?.data?.map((store: StoreWithDistance) => (
          <Card key={store.id} className={styles.storeCard}>
            <div className={styles.storeInfo}>
              <div className={styles.storeHeader}>
                <h3>{store.name}</h3>
                <Badge variant="outline">@{store.slug}</Badge>
              </div>
              <p className={styles.owner}>
                Owner: {(store as any).owner?.name || (store as any).owner?.email || 'Unknown'}
              </p>
            </div>

            <div className={styles.commissionSection}>
              {editingStore === store.id ? (
                <div className={styles.editForm}>
                  <div className={styles.inputGroup}>
                    <label>Commission Rate (%)</label>
                    <Input
                      type="number"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target?.value)}
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="2.9"
                    />
                  </div>
                  <div className={styles.editActions}>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={handleSave}
                      isLoading={updateCommissionMutation.isPending}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={styles.commissionDisplay}>
                  <div className={styles.rateDisplay}>
                    <span className={styles.rateLabel}>Current Rate:</span>
                    <span className={styles.rateValue}>
                      {store.commissionRate ? '' + store.commissionRate + '%' : 'Not Set (Default: 2.9%)'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => handleEdit(store)}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {stores?.data?.length === 0 && (
        <div className={styles.emptyState}>
          <p>No stores found.</p>
        </div>
      )}
    </div>
  )
}
