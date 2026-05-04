// @ts-nocheck
/**
 * StoreFormPage - Create or edit a store
 */
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { toast } from 'sonner'
import { handleApiError } from '@api/errors'
import { FormPageTemplate } from '@shared/ui/templates/FormPageTemplate'
import type { FormSection } from '@shared/ui/templates/FormPageTemplate'
import { createStoreFormSections } from '@features/auth'
import { MediaUploader } from '@features/media'
import type { StoreFormData } from '@api/types'
import { createInitialStoreFormData, transformStoreToFormData, cleanStoreFormData } from '@shared/lib/utils/form-utilities'

export default function StoreFormPage() {
  const { storeId } = useParams<{ storeId?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(storeId)

  // Form state using SDK-derived initialization - no manual field duplication!
  const [formData, setFormData] = useState<StoreFormData>(createInitialStoreFormData())

  // Fetch existing store for editing
  const { data: store, isLoading: isLoadingStore } = useQuery({
    queryKey: ['store', storeId],
    queryFn: async () => {
      return await apiClient.stores().getStoreById({ id: storeId! })
    },
    enabled: isEdit,
  })

  // Populate form when editing - dynamic transformation from SDK data
  useEffect(() => {
    if (store) {
      setFormData(transformStoreToFormData(store))
    }
  }, [store])

  // Create store mutation
  const createStoreMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiClient.stores().createStore({
        createStoreRequest: data,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-stores'] })
      toast.success('Store created successfully!')
      navigate('/vendor/dashboard')
    },
    onError: async (error) => {
      const appError = await handleApiError(error)
      toast.error(appError.message)
    },
  })

  // Update store mutation
  const updateStoreMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiClient.stores().updateStore({
        id: storeId!,
        createStoreRequest: data,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store', storeId] })
      queryClient.invalidateQueries({ queryKey: ['vendor-stores'] })
      toast.success('Store updated successfully!')
      navigate('/vendor/dashboard')
    },
    onError: async (error) => {
      const appError = await handleApiError(error)
      toast.error(appError.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Dynamic form data cleaning - no manual field listing!
    const cleanedData = cleanStoreFormData(formData)

    if (isEdit) {
      updateStoreMutation.mutate(cleanedData)
    } else {
      createStoreMutation.mutate(cleanedData as any)
    }
  }

  const handleChange = (field: keyof StoreFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Auto-generate slug from name
    if (field === 'name' && !isEdit) {
      const slug = String(value)
        .toLowerCase()
        .replaceAll(/[^\da-z]+/g, '-')
        .replaceAll(/^-|-$/g, '')
      setFormData((prev) => ({ ...prev, slug }))
    }
  }

  const isSubmitting = createStoreMutation.isPending || updateStoreMutation.isPending
  const sections = createStoreFormSections(formData, handleChange, isEdit)

  // Add media section if editing (can't upload media until store is created)
  const sectionsWithMedia: FormSection[] = isEdit && storeId
    ? [
        ...sections,
        {
          id: 'media',
          icon: '📸',
          title: 'Store Media',
          description: 'Upload images and videos to showcase your store',
          content: <MediaUploader storeId={storeId} maxFiles={10} />,
        },
      ]
    : sections

  return (
    <FormPageTemplate
      title={isEdit ? '✏️ Edit Store' : '+ Create Store'}
      backLabel="← Back to Dashboard"
      onBack={() => navigate('/vendor/dashboard')}
      sections={sectionsWithMedia}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? 'Update Store' : 'Create Store'}
      isSubmitting={isSubmitting}
      isLoading={isLoadingStore}
      loadingMessage="Loading store..."
    />
  )
}

