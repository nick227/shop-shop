/**
 * Customer Profile Hook
 * 
 * Extracts state management and business logic for customer profile page.
 */

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@features/auth/hooks/useAuth'
import { useCustomerStats } from '@shared/hooks/hooks/customer/useCustomerStats'

export interface ProfileFormData {
  name: string
  email: string
  phone: string
}

interface ProfileUserSnapshot {
  name?: string
  email?: string
  phone?: string
  createdAt?: string | number | Date
}

export function useCustomerProfile() {
  // ========================================
  // Auth and Stats
  // ========================================
  
  const { user } = useAuth()
  const { data: stats, isLoading } = useCustomerStats()
  const profileUser = user as ProfileUserSnapshot | undefined
  
  // ========================================
  // Form State
  // ========================================
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    name: profileUser?.name ?? '',
    email: profileUser?.email ?? '',
    phone: profileUser?.phone ?? ''
  })
  
  // ========================================
  // Effects
  // ========================================
  
  // Update form data when user data changes
  useEffect(() => {
    setFormData({
      name: profileUser?.name ?? '',
      email: profileUser?.email ?? '',
      phone: profileUser?.phone ?? ''
    })
  }, [profileUser?.name, profileUser?.email, profileUser?.phone])
  
  // ========================================
  // Event Handlers
  // ========================================
  
  const handleEdit = useCallback(() => {
    setIsEditing(true)
  }, [])
  
  const handleCancel = useCallback(() => {
    setIsEditing(false)
    setFormData({
      name: profileUser?.name ?? '',
      email: profileUser?.email ?? '',
      phone: profileUser?.phone ?? ''
    })
  }, [profileUser?.name, profileUser?.email, profileUser?.phone])
  
  const handleSave = useCallback(async () => {
    try {
      console.log('Saving profile:', formData)
      // Pending: implement actual profile update API call.
      await new Promise(resolve => setTimeout(resolve, 500)) // Mock API call
      
      setIsEditing(false)
      // Pending: show success message.
    } catch (error) {
      console.error('Failed to save profile:', error)
      // Pending: show error message.
    }
  }, [formData])
  
  const handleFieldChange = useCallback((field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])
  
  // ========================================
  // Computed Values
  // ========================================
  
  const hasChanges = JSON.stringify(formData) !== JSON.stringify({
    name: profileUser?.name ?? '',
    email: profileUser?.email ?? '',
    phone: profileUser?.phone ?? ''
  })
  
  const memberSince = profileUser?.createdAt ? new Date(profileUser.createdAt).toLocaleDateString() : '-'
  
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
