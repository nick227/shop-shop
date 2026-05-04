/**
 * Profile Field Component
 * 
 * Extracted profile form field with edit/view modes.
 */

import React from 'react'
import type { ProfileFormData } from '../hooks/useCustomerProfile'

interface ProfileFieldProps {
  label: string
  value: string
  isEditing: boolean
  field: keyof ProfileFormData
  formValue: string
  onChange: (field: keyof ProfileFormData, value: string) => void
  type?: 'text' | 'email' | 'tel'
  placeholder?: string
}

export function ProfileField({ 
  label, 
  value, 
  isEditing, 
  field, 
  formValue, 
  onChange, 
  type = 'text', 
  placeholder 
}: ProfileFieldProps) {
  return (
    <div>
      <label className="block text-caption mb-1.5">{label}</label>
      {!isEditing ? (
        <p className="text-base font-medium">{value}</p>
      ) : (
        <input
          type={type}
          className="w-full min-h-[44px] px-3 py-2 border border-input bg-background rounded-lg text-base focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
          value={formValue}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={placeholder || `Enter your ${label.toLowerCase()}`}
        />
      )}
    </div>
  )
}
