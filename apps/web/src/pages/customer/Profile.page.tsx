/**
 * CustomerProfilePage - View and edit customer profile;
 * Contact info, account stats, and saved addresses;
 */

import { useState } from 'react'
import { useAuth } from '@shared/hooks/useAuth'
import { useCustomerStats } from '@shared/hooks/customer/useCustomerStats'
import { Button, Card, Spinner } from '@shared/ui/primitives'
import { formatCurrency, formatDate } from '@shared/lib/format'

export default function CustomerProfilePage() {
  const { user } = useAuth()
  const { data: stats, isLoading } = useCustomerStats()
  const [isEditing, setIsEditing] = useState(false)

  // Form state for editing;
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''})

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || ''})
  }

  const handleSave = async () => {
    // TODO: Implement update profile API call;
    console.log('Saving profile:', formData)
    setIsEditing(false)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <Spinner size="large" />
        <p className="text-gray-600">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <header className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your account information</p>
      </header>

      {/* Personal Information */}
      <Card className="max-w-4xl mx-auto mb-6 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">👤</span>
            Personal Information;
          </h2>
          {!isEditing ? (
            <Button variant="secondary" size="small" onClick={handleEdit}>
              Edit;
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="small" onClick={handleCancel}>
                Cancel;
              </Button>
              <Button variant="primary" size="small" onClick={handleSave}>
                Save;
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            {!isEditing ? (
              <p className="text-base text-gray-900">{user?.name || '-'}</p>
            ) : (
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter your name"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            {!isEditing ? (
              <p className="text-base text-gray-900">{user?.email || '-'}</p>
            ) : (
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Enter your email"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            {!isEditing ? (
              <p className="text-base text-gray-900">{user?.phone || 'Not provided'}</p>
            ) : (
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            )}
          </div>
        </div>
      </Card>

      {/* Account Information */}
      <Card className="max-w-4xl mx-auto mb-6 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Account Information;
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <span className="block text-sm text-gray-600 mb-1">Member Since</span>
            <span className="block text-lg font-bold text-gray-900">
              {user?.createdAt ? formatDate(user.createdAt) : '-'}
            </span>
          </div>

          <div className="text-center">
            <span className="block text-sm text-gray-600 mb-1">Total Orders</span>
            <span className="block text-lg font-bold text-blue-600">{stats?.totalOrders || 0}</span>
          </div>

          <div className="text-center">
            <span className="block text-sm text-gray-600 mb-1">Total Spent</span>
            <span className="block text-lg font-bold text-green-600">
              {formatCurrency(stats?.totalSpent || 0)}
            </span>
          </div>

          <div className="text-center">
            <span className="block text-sm text-gray-600 mb-1">Avg Order Value</span>
            <span className="block text-lg font-bold text-purple-600">
              {formatCurrency(stats?.averageOrderValue || 0)}
            </span>
          </div>
        </div>
      </Card>

      {/* Saved Addresses */}
      <Card className="max-w-4xl mx-auto mb-6 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">📍</span>
            Saved Addresses;
          </h2>
          <Button variant="secondary" size="small">
            + Add Address;
          </Button>
        </div>

        <div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-6xl mb-4">📍</span>
            <p className="text-gray-900 font-medium mb-1">
              No saved addresses yet;
            </p>
            <p className="text-gray-600 text-sm">
              Add an address for faster checkout;
            </p>
          </div>
        </div>
      </Card>

      {/* Account Actions */}
      <Card className="max-w-4xl mx-auto mb-6 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            Account Settings;
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button variant="ghost" className="w-full justify-start">
            Change Password;
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Notification Settings;
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Privacy Settings;
          </Button>
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
            Delete Account;
          </Button>
        </div>
      </Card>
    </div>
  )
}
