// @ts-nocheck
/**
 * StoreFormPage - Create or edit a store
 */
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { toast } from 'sonner'
import { useAuthStore } from '@stores/authStore'
import { handleApiError } from '@api/errors'
import { FormPageTemplate } from '@shared/ui/templates/FormPageTemplate'
import { createStoreFormSections } from '@features/auth'
import type { StoreFormData } from '@api/types'
import { createInitialStoreFormData, transformStoreToFormData, cleanStoreFormData, storePayloadFromFormData } from '@shared/lib/utils/form-utilities'
import { authPost } from '@shared/lib/auth/authFetch'
import { DeleteStoreSection } from './components/DeleteStoreSection'
import { VendorStripeConnectSection } from './components/VendorStripeConnectSection'
import { usePublicMediaList } from '@shared/hooks/hooks/vendor/usePublicMediaList'

export default function StoreFormPage() {
  const { storeId } = useParams<{ storeId?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const updateUser = useAuthStore((state) => state.updateUser)
  const isEdit = Boolean(storeId)

  /** Files picked on create flow — uploaded in createStoreMutation.onSuccess once `id` exists */
  const [pendingScopedMediaFiles, setPendingScopedMediaFiles] = useState<File[]>([])

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

  // Fetch store media for edit mode (SDK strips imageUrl, so we fall back to primary media)
  const { data: storeMedia } = usePublicMediaList({ storeId: isEdit ? storeId! : undefined })

  // Populate form when editing - dynamic transformation from SDK data
  useEffect(() => {
    if (store) {
      const base = transformStoreToFormData(store)
      // SDK strips imageUrl — fall back to the lowest-sortIndex gallery image
      if (!base.imageUrl) {
        const primaryImage = storeMedia
          ?.filter((m) => m.kind === 'IMAGE')
          ?.sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))[0]?.url
        if (primaryImage) base.imageUrl = primaryImage
      }
      setFormData(base)
    }
  }, [store, storeMedia])

  // Create store mutation
  const createStoreMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const affiliateReferralCode = localStorage.getItem('affiliateReferralCode') || undefined
      const payload = {
        ...storePayloadFromFormData(data),
        ...(affiliateReferralCode ? { affiliateReferralCode } : {}),
      }
      return await apiClient.stores().createStore({
        createStoreRequest: payload as any,
      })
    },
    onSuccess: async (result) => {
      updateUser({ role: 'VENDOR' } as any)
      queryClient.invalidateQueries({ queryKey: ['vendor-stores'] })
      // Attribution has been snapshotted onto the new store; clear local cache.
      localStorage.removeItem('affiliateReferralCode')
      localStorage.removeItem('affiliateReferralId')
      const newId = (result as any).id as string | undefined

      if (newId && pendingScopedMediaFiles.length > 0) {
        try {
          for (const file of pendingScopedMediaFiles) {
            const fd = new FormData()
            fd.append('file', file)
            fd.append('storeId', newId)
            const res = await authPost('/api/media/upload', fd)
            if (!res.ok) {
              const errBody = (await res.json().catch(() => ({}))) as { error?: string }
              throw new Error(errBody.error || `Upload failed (${res.status})`)
            }
          }
          setPendingScopedMediaFiles([])
          queryClient.invalidateQueries({ queryKey: ['media'] })
          toast.success('Store created and media uploaded.')
        } catch {
          toast.error('Store created, but some media failed to upload. You can add them on the edit page.')
        }
      } else {
        toast.success('Store created! Add photos below.')
      }

      navigate(newId ? `/vendor/stores/${newId}/edit` : '/vendor/dashboard')
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
        createStoreRequest: storePayloadFromFormData(data),
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
  const sections = createStoreFormSections(
    formData,
    handleChange,
    isEdit,
    storeId,
    isEdit
      ? undefined
      : { files: pendingScopedMediaFiles, onFilesChange: setPendingScopedMediaFiles },
  )

  return (
    <FormPageTemplate
      title={isEdit ? '✏️ Edit Store' : '+ Create Store'}
      backLabel="← Back to Dashboard"
      onBack={() => navigate('/vendor/dashboard')}
      sections={sections}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? 'Update Store' : 'Create Store'}
      isSubmitting={isSubmitting}
      isLoading={isLoadingStore}
      loadingMessage="Loading store..."
      belowForm={
        isEdit && store ? (
          <div className="space-y-8">
            <VendorStripeConnectSection storeId={storeId!} />
            <DeleteStoreSection
              storeId={storeId!}
              storeName={store.name}
              onDeleted={() => {
                queryClient.invalidateQueries({ queryKey: ['vendor-stores'] })
                queryClient.removeQueries({ queryKey: ['store', storeId] })
                toast.success('Store deleted')
                navigate('/vendor/dashboard')
              }}
            />
          </div>
        ) : undefined
      }
    />
  )
}
