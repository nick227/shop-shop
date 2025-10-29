/**
 * ItemFormPage - Create or edit a menu item
 */
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { toast } from 'sonner'
import { handleApiError } from '@api/errors'
import { FormPageTemplate } from '@shared/ui/templates/FormPageTemplate'
import type { FormSection } from '@shared/ui/templates/FormPageTemplate'
import { createItemFormSections } from '@features/auth'
import { MediaUploader } from '@features/media'

export default function ItemFormPage() {
  const { storeId, itemId } = useParams<{ storeId: string; itemId?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(itemId)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    isActive: true,
    isSoldOut: false,
    stockQty: '',
    sortIndex: 0,
  })

  // Fetch store for context
  const { data: store } = useQuery({
    queryKey: ['store', storeId],
    queryFn: async () => {
      return await apiClient.stores().getStoreById({ id: storeId! })
    },
    enabled: !!storeId,
  })

  // Fetch existing item for editing
  const { data: item, isLoading: isLoadingItem } = useQuery({
    queryKey: ['item', itemId],
    queryFn: async () => {
      return await apiClient.items().getItemById({ id: itemId! })
    },
    enabled: isEdit,
  })

  // Populate form when editing
  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        price: item.price?.toString() || '',
        isActive: item.isActive ?? true,
        isSoldOut: item.isSoldOut ?? false,
        stockQty: item.stockQty?.toString() || '',
        sortIndex: item.sortIndex ?? 0,
      })
    }
  }, [item])

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiClient.items().createItem({
        createItemRequest: {
          storeId: storeId!,
          title: data.title,
          description: data.description || '',
          price: data.price,
          isActive: data.isActive,
          isSoldOut: data.isSoldOut,
          stockQty: data.stockQty ?? undefined,
          sortIndex: data.sortIndex,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', storeId] })
      toast.success('Item created successfully!')
      navigate('/vendor/stores/' + storeId + '/items')
    },
    onError: async (error) => {
      const appError = await handleApiError(error)
      toast.error(appError.message)
    },
  })

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiClient.items().updateItem({
        id: itemId!,
        updateItemRequest: {
          title: data.title,
          description: data.description || '',
          price: data.price,
          isActive: data.isActive,
          isSoldOut: data.isSoldOut,
          stockQty: data.stockQty ?? undefined,
          sortIndex: data.sortIndex,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', itemId] })
      queryClient.invalidateQueries({ queryKey: ['items', storeId] })
      toast.success('Item updated successfully!')
      navigate('/vendor/stores/' + storeId + '/items')
    },
    onError: async (error) => {
      const appError = await handleApiError(error)
      toast.error(appError.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate price
    if (!formData.price || Number.parseFloat(formData.price) < 0) {
      toast.error('Please enter a valid price')
      return
    }

    if (isEdit) {
      updateItemMutation.mutate({
        ...formData,
        price: formData.price,
        stockQty: formData.stockQty || '0'
      })
    } else {
      createItemMutation.mutate({
        ...formData,
        price: formData.price,
        stockQty: formData.stockQty || '0'
      })
    }
  }

  const handleChange = (field: keyof typeof formData | 'storeId', value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isSubmitting = createItemMutation.isPending || updateItemMutation.isPending
  const sections = createItemFormSections({ 
    ...formData, 
    storeId: storeId!,
    price: Number.parseFloat(formData.price) || 0,
    stockQty: Number.parseInt(formData.stockQty) || 0
  }, handleChange)

  // Add media section if editing (can't upload media until item is created)
  const sectionsWithMedia: FormSection[] = isEdit && itemId
    ? [
        ...sections,
        {
          id: 'media',
          icon: '📷',
          title: 'Item Media',
          description: 'Upload images and videos to showcase your item',
          content: <MediaUploader itemId={itemId} maxFiles={5} />,
        },
      ]
    : sections

  return (
    <FormPageTemplate
      title={isEdit ? '✏️ Edit Item' : '+ Add Item'}
      subtitle={store?.name || ''}
      backLabel="← Back to Items"
      onBack={() => navigate('/vendor/stores/' + storeId + '/items')}
      sections={sectionsWithMedia}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? 'Update Item' : 'Create Item'}
      isSubmitting={isSubmitting}
      isLoading={isLoadingItem}
      loadingMessage="Loading item..."
    />
  )
}

