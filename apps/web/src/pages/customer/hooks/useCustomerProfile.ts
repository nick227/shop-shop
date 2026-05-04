/**
 * Customer Profile Hook
 * 
 * Extracts state management and business logic for customer profile page.
 */

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@shared/hooks/hooks/useAuth'
import { useCustomerStats } from '@shared/hooks/hooks/customer/useCustomerStats'

export interface ProfileFormData {
  name: string
  email: string
  phone: string
}

export function useCustomerProfile() {
  // ========================================
  // Auth and Stats
  // ========================================
  
  const { user } = useAuth()
  const { data: stats, isLoading } = useCustomerStats()
  
  // ========================================
  // Form State
  // ========================================
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  })
  
  // ========================================
  // Effects
  // ========================================
  
  // Update form data when user data changes
  useEffect(() => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    })
  }, [user?.name, user?.email, user?.phone])
  
  // ========================================
  // Event Handlers
  // ========================================
  
  const handleEdit = useCallback(() => {
    setIsEditing(true)
  }, [])
  
  const handleCancel = useCallback(() => {
    setIsEditing(false)
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    })
  }, [user?.name, user?.email, user?.phone])
  
  const handleSave = useCallback(async () => {
    try {
      console.log('Saving profile:', formData)
      // TODO: Implement actual profile update API call
      await new Promise(resolve => setTimeout(resolve, 500)) // Mock API call
      
      setIsEditing(false)
      // TODO: Show success message
    } catch (error) {
      console.error('Failed to save profile:', error)
      // TODO: Show error message
    }
  }, [formData])
  
  const handleFieldChange = useCallback((field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])
  
  // ========================================
  // Computed Values
  // ========================================
  
  const hasChanges = JSON.stringify(formData) !== JSON.stringify({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  })
  
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'
  
  return {
    // Data
    user,
    stats,
    isLoading,
    
    // Form state
    isEditing,
    formData,
    hasChanges,
    memberSince,
    
    // Actions
    handleEdit,
    handleCancel,
    handleSave,
    handleFieldChange,
    
    // Computed values
    canSave: hasChanges && isEditing
  }
}
