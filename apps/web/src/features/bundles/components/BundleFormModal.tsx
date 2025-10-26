/**
 * Bundle Form Modal Component
 * Modal for creating and editing bundles
 */
import { useState, useEffect } from 'react'
import { Dialog } from '../../../components/ui/Dialog'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { TextArea } from '../../../components/ui/TextArea'
import { Select } from '../../../components/ui/Select'
import { BundleItemSelector } from './BundleItemSelector'
import { useBundleManagement } from '../hooks/useBundleManagement'
import { useBundlePricing } from '../hooks/useBundlePricing'
import type { Bundle } from '../../../api/types'
import type { BundleFormData } from '../types/bundle.types'

interface BundleFormModalProps {
  storeId: string
  bundle?: Bundle | null
  onClose: () => void
  className?: string
}

export function BundleFormModal({
  storeId,
  bundle,
  onClose,
  className = ''
}: BundleFormModalProps) {
  const isEditing = !!bundle
  const { createBundle, updateBundle, isCreating, isUpdating } = useBundleManagement({ storeId })

  const [formData, setFormData] = useState<BundleFormData>({
    name: '',
    description: '',
    imageUrl: '',
    isActive: true,
    sortIndex: 0,
    items: [],
    pricing: {
      pricingType: 'FIXED_PRICE',
      fixedPrice: 0,
      discountPercent: 0,
      discountAmount: 0,
      minSavings: 0,
      showSavings: true,
      savingsLabel: ''
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form data when editing
  useEffect(() => {
    if (bundle) {
      setFormData({
        name: bundle.name,
        description: bundle.description || '',
        imageUrl: bundle.imageUrl || '',
        isActive: bundle.isActive,
        sortIndex: bundle.sortIndex,
        items: bundle.items?.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          sortIndex: item.sortIndex
        })) || [],
        pricing: {
          pricingType: bundle.pricing?.pricingType || 'FIXED_PRICE',
          fixedPrice: bundle.pricing?.fixedPrice ?? undefined,
          discountPercent: bundle.pricing?.discountPercent ?? undefined,
          discountAmount: bundle.pricing?.discountAmount ?? undefined,
          minSavings: bundle.pricing?.minSavings ?? undefined,
          showSavings: bundle.pricing?.showSavings ?? true,
          savingsLabel: bundle.pricing?.savingsLabel ?? undefined
        }
      })
    }
  }, [bundle])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handlePricingChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [field]: value
      }
    }))
  }

  const handleItemsChange = (items: Array<{ itemId: string; quantity: number; sortIndex: number }>) => {
    setFormData(prev => ({
      ...prev,
      items
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData['name'].trim()) {
      newErrors.name = 'Bundle name is required'
    }

    if (formData['items'].length === 0) {
      newErrors.items = 'At least one item is required'
    }

    if (formData.pricing.pricingType === 'FIXED_PRICE' && (!formData.pricing['fixedPrice'] || formData.pricing['fixedPrice'] <= 0)) {
      newErrors.fixedPrice = 'Fixed price must be greater than 0'
    }

    if (formData.pricing.pricingType === 'DISCOUNT_PERCENT' && (!formData.pricing['discountPercent'] || formData.pricing['discountPercent'] <= 0)) {
      newErrors.discountPercent = 'Discount percentage must be greater than 0'
    }

    if (formData.pricing.pricingType === 'DISCOUNT_AMOUNT' && (!formData.pricing['discountAmount'] || formData.pricing['discountAmount'] <= 0)) {
      newErrors.discountAmount = 'Discount amount must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditing && bundle) {
        await updateBundle(bundle.id, formData)
      } else {
        await createBundle(formData)
      }
      
      onClose()
    } catch (error) {
      console.error('Failed to save bundle:', error)
      
      // Set form-level error
      setErrors(prev => ({
        ...prev,
        form: 'Failed to save bundle. Please check your input and try again.'
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoading = isCreating || isUpdating || isSubmitting

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title={isEditing ? 'Edit Bundle' : 'Create Bundle'}
      size="lg"
      className={className}
    >
      <form onSubmit={handleSubmit} className="bundle-form">
        <div className="bundle-form__section">
          <h3>Basic Information</h3>
          
          <div className="bundle-form__field">
            <label htmlFor="name">Bundle Name *</label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Burger Combo"
              error={errors.name}
            />
          </div>

          <div className="bundle-form__field">
            <label htmlFor="description">Description</label>
            <TextArea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your bundle..."
              rows={3}
            />
          </div>

          <div className="bundle-form__field">
            <label htmlFor="imageUrl">Image URL</label>
            <Input
              id="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => handleInputChange('imageUrl', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        <div className="bundle-form__section">
          <h3>Items</h3>
          <BundleItemSelector
            storeId={storeId}
            items={formData.items}
            onChange={handleItemsChange}
            error={errors.items}
          />
        </div>

        <div className="bundle-form__section">
          <h3>Pricing</h3>
          
          <div className="bundle-form__field">
            <label htmlFor="pricingType">Pricing Type</label>
            <Select
              id="pricingType"
              value={formData.pricing.pricingType}
              onChange={(e) => handlePricingChange('pricingType', e.target.value)}
            >
              <option value="FIXED_PRICE">Fixed Price</option>
              <option value="DISCOUNT_PERCENT">Percentage Discount</option>
              <option value="DISCOUNT_AMOUNT">Amount Discount</option>
            </Select>
          </div>

          {formData.pricing.pricingType === 'FIXED_PRICE' && (
            <div className="bundle-form__field">
              <label htmlFor="fixedPrice">Bundle Price *</label>
              <Input
                id="fixedPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.pricing.fixedPrice || ''}
                onChange={(e) => handlePricingChange('fixedPrice', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                error={errors.fixedPrice}
              />
            </div>
          )}

          {formData.pricing.pricingType === 'DISCOUNT_PERCENT' && (
            <div className="bundle-form__field">
              <label htmlFor="discountPercent">Discount Percentage *</label>
              <Input
                id="discountPercent"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.pricing.discountPercent || ''}
                onChange={(e) => handlePricingChange('discountPercent', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                error={errors.discountPercent}
              />
            </div>
          )}

          {formData.pricing.pricingType === 'DISCOUNT_AMOUNT' && (
            <div className="bundle-form__field">
              <label htmlFor="discountAmount">Discount Amount *</label>
              <Input
                id="discountAmount"
                type="number"
                step="0.01"
                min="0"
                value={formData.pricing.discountAmount || ''}
                onChange={(e) => handlePricingChange('discountAmount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                error={errors.discountAmount}
              />
            </div>
          )}

          <div className="bundle-form__field">
            <label htmlFor="savingsLabel">Savings Label</label>
            <Input
              id="savingsLabel"
              type="text"
              value={formData.pricing.savingsLabel || ''}
              onChange={(e) => handlePricingChange('savingsLabel', e.target.value)}
              placeholder="e.g., Save $5!"
            />
          </div>
        </div>

        {/* Form-level error display */}
        {errors.form && (
          <div className="bundle-form__error">
            <p>{errors.form}</p>
          </div>
        )}

        <div className="bundle-form__actions">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : (isEditing ? 'Update Bundle' : 'Create Bundle')}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

// Bundle Form Modal Styles
export const bundleFormModalStyles = `
.bundle-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.bundle-form__section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bundle-form__section h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.bundle-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bundle-form__field label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.bundle-form__error {
  padding: 0.75rem;
  background: var(--error-background);
  border: 1px solid var(--error-color);
  border-radius: 0.375rem;
  color: var(--error-color);
  margin-bottom: 1rem;
}

.bundle-form__error p {
  margin: 0;
  font-size: 0.875rem;
}

.bundle-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}
`
