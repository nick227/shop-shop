/**
 * useStoreForm - Encapsulates store form state, queries, media queue, and create/update mutations.
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const isEdit = Boolean(storeId)

  const [pendingScopedMediaFiles, setPendingScopedMediaFiles] = useState<File[]>([])
  const [formData, setFormData] = useState<StoreFormData>(createInitialStoreFormData())
  const creatingRef = useRef(false)

  const { data: store, isLoading: isLoadingStore } = useQuery({
    queryKey: ['store', storeId],
    queryFn: async () => apiClient.stores().getStoreById({ id: storeId! }),
    enabled: isEdit,
  })

  const { data: storeMedia } = usePublicMediaList({ storeId: isEdit ? storeId! : undefined })

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
      updateUser({ role: 'VENDOR' } as any)
      localStorage.removeItem('affiliateReferralCode')
      localStorage.removeItem('affiliateReferralId')
      const newId = (result as any).id as string | undefined

      if (newId) {
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
      if (newId) {
        navigate(`/vendor/stores/${newId}/edit`, { replace: true })
      }
    },
    onError: async (error) => {
      const appError = await handleApiError(error)
      toast.error(appError.message)
    },
  })

  const updateStoreMutation = useMutation({
    mutationFn: async (data: StoreFormData) => {
      const payload = storePayloadFromFormData(data)
      return await apiClient.stores().updateStore({
        id: storeId!,
        updateStoreRequest: payload as any,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store', storeId] })
      queryClient.invalidateQueries({ queryKey: ['vendor-managed-stores'] })
      queryClient.invalidateQueries({ queryKey: ['vendor-stores'] })
      toast.success('Store updated successfully!')
    },
    onError: async (error) => {
      const appError = await handleApiError(error)
      toast.error(appError.message)
    },
  })

  const handleChange = <K extends keyof StoreFormData>(field: K, value: StoreFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (field === 'name') {
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
    store,
    isLoadingStore,
    formData,
    pendingScopedMediaFiles,
    setPendingScopedMediaFiles,
    isSubmitting: createStoreMutation.isPending || updateStoreMutation.isPending,
    handleChange,
    handleSubmit,
    onBack: () => navigate('/vendor/dashboard'),
  }
}
