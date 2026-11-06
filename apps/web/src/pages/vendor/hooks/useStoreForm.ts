/**
 * useStoreForm - Encapsulates store form state, queries, media queue, and create/update mutations.
 */
import { vendorPaths } from '@shared/lib/utils/navigation/vendorPaths'
import { useState, useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@api/client'
import { stores as storesApi } from '@api/apiWrapper'
import { handleApiError } from '@api/errors'
import type { StoreFormData } from '@api/types'
import { useAuthStore } from '@stores/authStore'
import {
  createInitialStoreFormData,
  transformStoreToFormData,
  cleanStoreFormData,
  storePayloadFromFormData,
} from '@shared/lib/utils/form-utilities'
import { authPost } from '@shared/lib/auth/authFetch'
import { usePublicMediaList } from '@shared/hooks/hooks/vendor/usePublicMediaList'

export function useStoreForm(storeId?: string) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  // A store created from /vendor/new; later saves update it while the shopper keeps filling in the form.
  const [createdStoreId, setCreatedStoreId] = useState<string | undefined>()
  const targetStoreId = storeId ?? createdStoreId
  const isEdit = Boolean(targetStoreId)

  const [pendingScopedMediaFiles, setPendingScopedMediaFiles] = useState<File[]>([])
  const [formData, setFormData] = useState<StoreFormData>(createInitialStoreFormData())
  // The last saved values; the form is dirty when it differs from these.
  const [baseline, setBaseline] = useState<StoreFormData | null>(null)
  const creatingRef = useRef(false)
  const submittedRef = useRef<StoreFormData | null>(null)

  const { data: store, isLoading: isLoadingStore } = useQuery({
    queryKey: ['store', storeId],
    queryFn: async () => apiClient.stores().getStoreById({ id: storeId! }),
    // Only the store in the URL is loaded; a just-created store keeps what is in the form.
    enabled: Boolean(storeId),
  })

  const { data: storeMedia } = usePublicMediaList({ storeId })

  useEffect(() => {
    if (store) {
      const base = transformStoreToFormData(store as any)
      if (!base.imageUrl) {
        const primaryImage = storeMedia
          ?.filter((m) => m.kind === 'IMAGE')
          ?.sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))[0]?.url
        if (primaryImage) base.imageUrl = primaryImage
      }
      setFormData(base)
      setBaseline(base)
    }
  }, [store, storeMedia])

  const createStoreMutation = useMutation({
    mutationFn: async (data: StoreFormData) => {
      const affiliateReferralCode = localStorage.getItem('affiliateReferralCode') || undefined
      const payload = {
        ...storePayloadFromFormData(data),
        email: data.email?.trim() || user?.email || '',
        ...(affiliateReferralCode ? { affiliateReferralCode } : {}),
      }
      return await storesApi.create(payload as any)
    },
    onSuccess: async (result) => {
      void queryClient.invalidateQueries({ queryKey: ['account-capabilities', user?.id] })
      localStorage.removeItem('affiliateReferralCode')
      localStorage.removeItem('affiliateReferralId')
      const newId = (result as any).id as string | undefined

      if (newId) {
        setCreatedStoreId(newId)
        if (submittedRef.current) setBaseline(submittedRef.current)
        // Keep the form where it is; only the address changes, so a reload opens this store's Overview.
        window.history.replaceState(window.history.state, '', vendorPaths.overview(newId))
        queryClient.setQueryData(
          ['vendor-managed-stores', user?.id],
          (stores: any[] | undefined) =>
            stores ? [result, ...stores.filter((s) => s.id !== newId)] : stores,
        )
      }

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
        toast.success('Store created.')
      }

      void queryClient.invalidateQueries({ queryKey: ['vendor-managed-stores'] })
      void queryClient.invalidateQueries({ queryKey: ['vendor-stores'] })
    },
    onError: async (error) => {
      void queryClient.invalidateQueries({ queryKey: ['store-readiness', targetStoreId] })
      const appError = await handleApiError(error)
      toast.error(appError.message)
    },
  })

  const updateStoreMutation = useMutation({
    mutationFn: async (data: StoreFormData) => {
      const payload = storePayloadFromFormData(data)
      return await apiClient.stores().updateStore({
        id: targetStoreId!,
        updateStoreRequest: payload as any,
      })
    },
    onSuccess: () => {
      if (submittedRef.current) setBaseline(submittedRef.current)
      queryClient.invalidateQueries({ queryKey: ['store', targetStoreId] })
      queryClient.invalidateQueries({ queryKey: ['vendor-managed-stores'] })
      queryClient.invalidateQueries({ queryKey: ['vendor-stores'] })
      void queryClient.invalidateQueries({ queryKey: ['store-readiness', targetStoreId] })
      toast.success('Saved')
    },
    onError: async (error) => {
      void queryClient.invalidateQueries({ queryKey: ['store-readiness', targetStoreId] })
      const appError = await handleApiError(error)
      toast.error(appError.message)
    },
  })

  const handleChange = <K extends keyof StoreFormData>(field: K, value: StoreFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // The slug follows the name only until the store exists; after that a rename keeps its public address.
    if (field === 'name' && !isEdit) {
      const slug = String(value)
        .toLowerCase()
        .replaceAll(/[^\da-z]+/g, '-')
        .replaceAll(/^-|-$/g, '')
      setFormData((prev) => ({ ...prev, slug }))
    }
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!formData.name.trim()) return
    if (creatingRef.current || createStoreMutation.isPending || updateStoreMutation.isPending) return
    const cleanedData = cleanStoreFormData(formData)
    submittedRef.current = formData
    if (isEdit) {
      updateStoreMutation.mutate(cleanedData)
      return
    }
    creatingRef.current = true
    createStoreMutation.mutate(cleanedData, {
      onSettled: () => {
        creatingRef.current = false
      },
    })
  }

  return {
    isEdit,
    storeId: targetStoreId,
    store,
    isLoadingStore,
    formData,
    pendingScopedMediaFiles,
    setPendingScopedMediaFiles,
    isSubmitting: createStoreMutation.isPending || updateStoreMutation.isPending,
    handleChange,
    handleSubmit,
    isDirty:
      isEdit &&
      baseline !== null &&
      (JSON.stringify(formData) !== JSON.stringify(baseline) || pendingScopedMediaFiles.length > 0),
    discardChanges: () => {
      if (baseline) setFormData(baseline)
      setPendingScopedMediaFiles([])
    },
  }
}
