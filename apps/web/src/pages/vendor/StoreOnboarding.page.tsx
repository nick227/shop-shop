/**
 * Vendor Store Onboarding Page - First store setup for new vendors
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { useAuth } from '@features/auth/hooks/useAuth'
import { Button, Input, TextArea, Checkbox } from '@shared/ui/primitives'
import { Card, CardHeader, CardTitle, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { PageShell } from '@shared/ui/layout/PageShell'
import { Store as StoreIcon, MapPin, Clock, Package } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'

// Store onboarding schema
const storeOnboardingSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  address: z.string().min(1, 'Address is required'),
  pickupEnabled: z.boolean().default(true),
  deliveryEnabled: z.boolean().default(true),
  deliveryRadius: z.number().min(1, 'Delivery radius must be at least 1 mile').max(50, 'Delivery radius cannot exceed 50 miles'),
  prepTime: z.number().min(5, 'Prep time must be at least 5 minutes').max(120, 'Prep time cannot exceed 120 minutes'),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED']).default('DRAFT'),
})

type StoreOnboardingData = z.infer<typeof storeOnboardingSchema>

const zodFormResolver: Resolver<StoreOnboardingData> = async (values) => {
  const parsed = storeOnboardingSchema.safeParse(values)
  if (parsed.success) {
    return { values: parsed.data, errors: {} }
  }

  const { fieldErrors } = parsed.error.flatten()
  const errors = Object.fromEntries(
    Object.entries(fieldErrors).map(([key, messages]) => [
      key,
      { type: 'validation', message: messages?.[0] ?? 'Invalid value' },
    ])
  )

  return { values: {}, errors }
}

export default function VendorStoreOnboardingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<StoreOnboardingData>({
    resolver: zodFormResolver,
    defaultValues: {
      name: '',
      description: '',
      address: '',
      pickupEnabled: true,
      deliveryEnabled: true,
      deliveryRadius: 25,
      prepTime: 30,
      status: 'DRAFT',
    },
  })

  const pickupEnabled = watch('pickupEnabled')
  const deliveryEnabled = watch('deliveryEnabled')

  const createStoreMutation = useMutation({
    mutationFn: async (data: StoreOnboardingData) => {
      return await apiClient.stores().createStore({ 
        createStoreRequest: {
          name: data.name,
          slug: data.name.toLowerCase().replaceAll(/\s+/g, '-'),
          description: data.description,
          addressStreet: data.address,
          pickupEnabled: data.pickupEnabled,
          deliveryEnabled: data.deliveryEnabled,
          deliveryDistance: data.deliveryRadius.toString(),
          prepTimeMin: data.prepTime,
          isPublished: data.status === 'ACTIVE',
          phone: '',
          email: '',
          website: ''
        }
      })
    },
    onSuccess: (response) => {
      // Handle different response structures
      const storeId = (response as any)?.id || (response as any)?.data?.id
      if (storeId) {
        navigate(`/vendor/stores/${storeId}/settings`)
      }
    },
    onError: (error) => {
      console.error('Store creation failed:', error)
      setIsSubmitting(false)
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const onSubmit = handleSubmit((data: StoreOnboardingData) => {
    setIsSubmitting(true)
    createStoreMutation.mutate(data)
  })

  return (
    <PageShell className="bg-background" containerClassName="max-w-4xl" contentClassName="py-6 md:py-6">
      <PageHeader
        title="Create Your Store"
        description="Set up your store details to start selling to customers"
        breadcrumbs={[
          { label: 'Vendor', href: '/vendor/dashboard' },
          { label: 'Create Store' },
        ]}
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StoreIcon className="h-5 w-5" />
              Store Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label htmlFor="name" className="text-sm font-medium">Store Name *</label>
                  </div>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Your Store Name"
                    disabled={isSubmitting}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <label htmlFor="description" className="text-sm font-medium">Description *</label>
                  </div>
                  <TextArea
                    id="description"
                    {...register('description')}
                    placeholder="Describe your store, cuisine, and what makes it special..."
                    rows={3}
                    disabled={isSubmitting}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <div className="space-y-1">
                  <label htmlFor="address" className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4" />
                    Store Address *
                  </label>
                </div>
                <Input
                  id="address"
                  {...register('address')}
                  placeholder="123 Main St, City, State 12345"
                  disabled={isSubmitting}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address.message}</p>
                )}
              </div>

              {/* Delivery Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Delivery Settings</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label htmlFor="pickupEnabled" className="text-sm font-medium">Enable Pickup</label>
                    <p className="text-sm text-muted-foreground">
                      Allow customers to pick up orders from your store
                    </p>
                  </div>
                  <Checkbox
                    id="pickupEnabled"
                    checked={pickupEnabled}
                    onChange={(e) => setValue('pickupEnabled', e.target.checked)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label htmlFor="deliveryEnabled" className="text-sm font-medium">Enable Delivery</label>
                    <p className="text-sm text-muted-foreground">
                      Deliver orders to customers within your service area
                    </p>
                  </div>
                  <Checkbox
                    id="deliveryEnabled"
                    checked={deliveryEnabled}
                    onChange={(e) => setValue('deliveryEnabled', e.target.checked)}
                    disabled={isSubmitting}
                  />
                </div>

                {deliveryEnabled && (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label htmlFor="deliveryRadius" className="flex items-center gap-2 text-sm font-medium">
                        <MapPin className="h-4 w-4" />
                        Delivery Radius (miles) *
                      </label>
                    </div>
                    <Input
                      id="deliveryRadius"
                      type="number"
                      {...register('deliveryRadius', { valueAsNumber: true })}
                      placeholder="25"
                      min={1}
                      max={50}
                      disabled={isSubmitting}
                    />
                    {errors.deliveryRadius && (
                      <p className="text-sm text-destructive">{errors.deliveryRadius.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Order Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Order Settings</h3>
                
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label htmlFor="prepTime" className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="h-4 w-4" />
                      Average Prep Time (minutes) *
                    </label>
                  </div>
                  <Input
                    id="prepTime"
                    type="number"
                    {...register('prepTime', { valueAsNumber: true })}
                    placeholder="30"
                    min={5}
                    max={120}
                    disabled={isSubmitting}
                  />
                  {errors.prepTime && (
                    <p className="text-sm text-destructive">{errors.prepTime.message}</p>
                  )}
                </div>
              </div>

              {/* Store Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Store Status</h3>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Store Status</label>
                  </div>
                  <select
                    {...register('status')}
                    className="w-full p-2 border rounded-md"
                    disabled={isSubmitting}
                  >
                    <option value="DRAFT">Draft - Not visible to customers</option>
                    <option value="ACTIVE">Active - Accepting orders</option>
                    <option value="PAUSED">Paused - Temporarily closed</option>
                  </select>
                  {errors.status && (
                    <p className="text-sm text-destructive">{errors.status.message}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/vendor/dashboard')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? 'Creating...' : 'Create Store'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
