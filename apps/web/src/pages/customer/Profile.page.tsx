/**
 * CustomerProfilePage - Refactored View and edit customer profile
 * 
 * Refactored to use extracted hook and component.
 * Reduced complexity by separating concerns.
 */

import React from 'react'
import { Button, Spinner } from '@shared/ui/primitives'
import { Card, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import { PageHeader, SectionHeader } from '@shared/ui/layout/PageLayout'
import { PageShell } from '@shared/ui/layout/PageShell'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { User, BarChart3, MapPin, Settings, Plus } from 'lucide-react'
import { formatCurrency } from '@shared/lib/format'

// Extracted components and hooks
import { useCustomerProfile } from './hooks/useCustomerProfile'
import { ProfileField } from './components/ProfileField'

export default function CustomerProfilePage() {
  const {
    user,
    stats,
    isLoading,
    isEditing,
    formData,
    memberSince,
    handleEdit,
    handleCancel,
    handleSave,
    handleFieldChange,
    canSave
  } = useCustomerProfile()

  // ========================================
  // Loading State
  // ========================================
  
  if (isLoading) {
    return (
      <PageShell nested className="bg-background" containerClassName="max-w-4xl" contentClassName="py-6 md:py-6">
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-border bg-card p-4">
          <Spinner size="large" />
          <p className="mt-4 text-muted-foreground text-sm">Loading profile...</p>
        </div>
      </PageShell>
    )
  }

  // ========================================
  // Main Content
  // ========================================
  
  return (
    <PageShell nested className="bg-background" containerClassName="max-w-4xl" contentClassName="space-y-5 py-6 md:py-6">
      <PageHeader title="My Profile" description="Manage your account information" />

      {/* Personal Information */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex justify-between items-center mb-5">
            <SectionHeader title="Personal Information" />
            {!isEditing ? (
              <Button variant="outline" size="small" onClick={handleEdit}>Edit</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="small" onClick={handleCancel}>Cancel</Button>
                <Button variant="primary" size="small" onClick={handleSave} disabled={!canSave}>Save</Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ProfileField 
              label="Full Name" 
              value={user?.name || '-'} 
              isEditing={isEditing} 
              field="name" 
              formValue={formData.name} 
              onChange={handleFieldChange} 
            />
            <ProfileField 
              label="Email" 
              value={user?.email || '-'} 
              isEditing={isEditing} 
              field="email" 
              formValue={formData.email} 
              onChange={handleFieldChange} 
              type="email" 
            />
            <ProfileField 
              label="Phone" 
              value={user?.phone || 'Not provided'} 
              isEditing={isEditing} 
              field="phone" 
              formValue={formData.phone} 
              onChange={handleFieldChange} 
              type="tel" 
              placeholder="(555) 123-4567" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Stats */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader title="Account Information" className="mb-5" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-0.5 text-center">
              <span className="text-caption">Member Since</span>
              <span className="font-medium text-sm">{memberSince}</span>
            </div>
            <div className="flex flex-col gap-0.5 text-center">
              <span className="text-caption">Total Orders</span>
              <span className="font-bold text-lg">{stats?.totalOrders || 0}</span>
            </div>
            <div className="flex flex-col gap-0.5 text-center">
              <span className="text-caption">Total Spent</span>
              <span className="font-bold text-lg">{formatCurrency(stats?.totalSpent || 0)}</span>
            </div>
            <div className="flex flex-col gap-0.5 text-center">
              <span className="text-caption">Avg Order</span>
              <span className="font-bold text-lg">{formatCurrency(stats?.averageOrderValue || 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saved Addresses */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex justify-between items-center mb-5">
            <SectionHeader title="Saved Addresses" />
            <Button variant="outline" size="small">
              <Plus className="w-4 h-4 mr-1" />
              Add Address
            </Button>
          </div>
          <EmptyState
            icon={MapPin}
            title="No saved addresses yet"
            description="Add an address for faster checkout"
            className="border-0 bg-transparent"
          />
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader title="Account Settings" className="mb-5" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Button variant="ghost" className="w-full justify-start">Change Password</Button>
            <Button variant="ghost" className="w-full justify-start">Notification Settings</Button>
            <Button variant="ghost" className="w-full justify-start">Privacy Settings</Button>
            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}
