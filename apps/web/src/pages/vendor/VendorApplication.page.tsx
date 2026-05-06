/**
 * VendorApplicationPage - MVP vendor application form
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { toast } from 'sonner'
import { handleApiError } from '@api/errors'
import { Button, Input, TextArea, Alert } from '@shared/ui/primitives'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { PageShell } from '@shared/ui/layout/PageShell'
import { ArrowLeft } from 'lucide-react'

interface VendorApplicationData {
  businessName: string
  contactName: string
  email: string
  phone: string
  businessType: 'INDIVIDUAL' | 'LLC' | 'CORPORATION' | 'PARTNERSHIP'
  description: string
}

export default function VendorApplicationPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<VendorApplicationData>({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    businessType: 'INDIVIDUAL',
    description: '',
  })

  const submitApplication = useMutation({
    mutationFn: async (data: VendorApplicationData) => {
      // TODO: Update to use actual API endpoint when implemented
      return await fetch('/api/vendor/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json())
    },
    onSuccess: () => {
      toast.success('Application submitted successfully!')
      navigate('/vendor/application-status')
    },
    onError: async (error) => {
      const appError = await handleApiError(error)
      toast.error(appError.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitApplication.mutate(formData)
  }

  const handleChange = (field: keyof VendorApplicationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <PageShell className="bg-background" containerClassName="max-w-2xl" contentClassName="py-6 md:py-6">
      <PageHeader
        title="Apply to Become a Vendor"
        description="Start selling on Shop Shop by completing our vendor application"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Business Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Business Name *"
              value={formData.businessName}
              onChange={(e) => handleChange('businessName', e.target.value)}
              placeholder="Your Business Name"
              required
            />

            <Input
              label="Contact Name *"
              value={formData.contactName}
              onChange={(e) => handleChange('contactName', e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="contact@business.com"
              required
            />

            <Input
              label="Phone *"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Type *
            </label>
            <select
              value={formData.businessType}
              onChange={(e) => handleChange('businessType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="INDIVIDUAL">Individual/Sole Proprietor</option>
              <option value="LLC">Limited Liability Company (LLC)</option>
              <option value="CORPORATION">Corporation</option>
              <option value="PARTNERSHIP">Partnership</option>
            </select>
          </div>

          <div>
            <TextArea
              label="Business Description *"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Tell us about your business, what you plan to sell, and what makes you unique..."
              rows={4}
              required
              helperText="Minimum 10 characters"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={submitApplication.isPending}
            disabled={submitApplication.isPending}
          >
            {submitApplication.isPending ? 'Submitting...' : 'Submit Application'}
          </Button>
        </div>
      </form>
    </PageShell>
  )
}
