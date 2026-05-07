// @ts-nocheck
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { toast } from 'sonner'
import { handleApiError } from '@api/errors'
import { Button, Badge, Spinner } from '@shared/ui/primitives'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/primitives/ui/Card/Card'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { PageShell } from '@shared/ui/layout/PageShell'
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react'
import { formatCurrency } from '@shared/lib/utils/format'

const PRICING_TYPES = [
  { value: 'FIXED_PRICE', label: 'Fixed price' },
  { value: 'DISCOUNT_PERCENT', label: '% off total' },
  { value: 'DISCOUNT_AMOUNT', label: '$ off total' },
  { value: 'BEST_DEAL', label: 'Best deal (auto)' },
] as const

type PricingType = typeof PRICING_TYPES[number]['value']

interface BundleItemRow {
  itemId: string
  title: string
  price: number
  quantity: number
}

interface FormState {
  name: string
  description: string
  isActive: boolean
  pricingType: PricingType
  fixedPrice: string
  discountPercent: string
  discountAmount: string
  showSavings: boolean
  savingsLabel: string
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  isActive: true,
  pricingType: 'FIXED_PRICE',
  fixedPrice: '',
  discountPercent: '',
  discountAmount: '',
  showSavings: true,
  savingsLabel: '',
}

export default function StoreBundleEditorPage() {
  const { storeId, bundleId } = useParams<{ storeId: string; bundleId?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = !!bundleId && bundleId !== 'new'

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [selectedItems, setSelectedItems] = useState<BundleItemRow[]>([])
  const [itemSearchQuery, setItemSearchQuery] = useState('')

  const { data: itemsData } = useQuery({
    queryKey: ['items', storeId],
    queryFn: () => apiClient.items().listItems({ storeId }),
    enabled: !!storeId,
  })

  const storeItems = (itemsData?.data ?? []).filter((i: any) => i.isActive && !i.isSoldOut)
  const filteredItems = storeItems.filter((i: any) =>
    i.title.toLowerCase().includes(itemSearchQuery.toLowerCase()),
  )

  const { data: existingBundle, isLoading: isLoadingBundle } = useQuery({
    queryKey: ['bundle', bundleId],
    queryFn: () => apiClient.bundles().getBundleById({ id: bundleId! }),
    enabled: isEditing,
  })

  useEffect(() => {
    if (!existingBundle) return
    const b = existingBundle as any
    setForm({
      name: b.name ?? '',
      description: b.description ?? '',
      isActive: b.isActive ?? true,
      pricingType: b.pricing?.pricingType ?? 'FIXED_PRICE',
      fixedPrice: b.pricing?.fixedPrice?.toString() ?? '',
      discountPercent: b.pricing?.discountPercent?.toString() ?? '',
      discountAmount: b.pricing?.discountAmount?.toString() ?? '',
      showSavings: b.pricing?.showSavings ?? true,
      savingsLabel: b.pricing?.savingsLabel ?? '',
    })
    if (Array.isArray(b.items)) {
      setSelectedItems(
        b.items.map((bi: any) => ({
          itemId: bi.itemId ?? bi.item?.id,
          title: bi.item?.title ?? bi.title ?? '',
          price: Number(bi.item?.price ?? bi.price ?? 0),
          quantity: bi.quantity ?? 1,
        })),
      )
    }
  }, [existingBundle])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const pricing = {
        pricingType: form.pricingType,
        ...(form.fixedPrice && { fixedPrice: Number(form.fixedPrice) }),
        ...(form.discountPercent && { discountPercent: Number(form.discountPercent) }),
        ...(form.discountAmount && { discountAmount: Number(form.discountAmount) }),
        showSavings: form.showSavings,
        ...(form.savingsLabel && { savingsLabel: form.savingsLabel }),
      }
      const payload = {
        storeId: storeId!,
        name: form.name,
        description: form.description || undefined,
        isActive: form.isActive,
        items: selectedItems.map((si, idx) => ({ itemId: si.itemId, quantity: si.quantity, sortIndex: idx })),
        pricing,
      }
      if (isEditing) {
        return apiClient.bundles().updateBundle({ id: bundleId!, updateBundleRequest: payload as any })
      }
      return apiClient.bundles().createBundle({ createBundleRequest: payload as any })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles', storeId] })
      toast.success(isEditing ? 'Bundle updated' : 'Bundle created')
      navigate(`/vendor/stores/${storeId}/bundles`)
    },
    onError: async (error) => {
      const appError = await handleApiError(error)
      toast.error(appError.message)
    },
  })

  const addItem = (item: any) => {
    if (selectedItems.find((si) => si.itemId === item.id)) return
    setSelectedItems((prev) => [
      ...prev,
      { itemId: item.id, title: item.title, price: Number(item.price), quantity: 1 },
    ])
  }

  const removeItem = (itemId: string) =>
    setSelectedItems((prev) => prev.filter((si) => si.itemId !== itemId))

  const updateQuantity = (itemId: string, quantity: number) =>
    setSelectedItems((prev) =>
      prev.map((si) => (si.itemId === itemId ? { ...si, quantity: Math.max(1, quantity) } : si)),
    )

  const itemSum = selectedItems.reduce((sum, si) => sum + si.price * si.quantity, 0)

  const resolvedPreview = (): number | null => {
    if (selectedItems.length === 0) return null
    switch (form.pricingType) {
      case 'FIXED_PRICE':
        return form.fixedPrice ? Number(form.fixedPrice) : null
      case 'DISCOUNT_PERCENT':
        return form.discountPercent ? itemSum * (1 - Number(form.discountPercent) / 100) : null
      case 'DISCOUNT_AMOUNT':
        return form.discountAmount ? itemSum - Number(form.discountAmount) : null
      case 'BEST_DEAL': {
        const candidates = [
          form.fixedPrice ? Number(form.fixedPrice) : Infinity,
          form.discountPercent ? itemSum * (1 - Number(form.discountPercent) / 100) : Infinity,
          form.discountAmount ? itemSum - Number(form.discountAmount) : Infinity,
        ]
        const best = Math.min(...candidates)
        return best === Infinity ? null : best
      }
    }
  }

  const preview = resolvedPreview()
  const savings = preview != null ? itemSum - preview : null
  const canSave = form.name.trim().length > 0 && selectedItems.length > 0

  if (isEditing && isLoadingBundle) {
    return (
      <PageShell nested className="bg-background" containerClassName="max-w-3xl" contentClassName="py-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <Spinner size="large" />
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell nested className="bg-background" containerClassName="max-w-3xl" contentClassName="space-y-6 py-6 md:py-6">
      <PageHeader
        title={isEditing ? 'Edit Bundle' : 'Create Bundle'}
        description="Define the items included and set a pricing strategy"
        backButton={
          <Button
            variant="ghost"
            size="small"
            onClick={() => navigate(`/vendor/stores/${storeId}/bundles`)}
            className="-ml-2 text-muted-foreground hover:bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Bundles
          </Button>
        }
      />

      <Card>
        <CardHeader><CardTitle>Basic info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Bundle name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Taco Tuesday Box"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Tell customers what's included…"
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              id="isActive"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-border"
            />
            <label htmlFor="isActive" className="text-sm">Active (visible to customers)</label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Included items</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {selectedItems.length > 0 && (
            <div className="space-y-2">
              {selectedItems.map((si) => (
                <div key={si.itemId} className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-sm font-medium line-clamp-1">{si.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{formatCurrency(si.price)} ea.</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      className="w-6 h-6 rounded border border-border text-xs hover:bg-muted flex items-center justify-center"
                      onClick={() => updateQuantity(si.itemId, si.quantity - 1)}
                    >−</button>
                    <span className="w-6 text-center text-sm">{si.quantity}</span>
                    <button
                      type="button"
                      className="w-6 h-6 rounded border border-border text-xs hover:bg-muted flex items-center justify-center"
                      onClick={() => updateQuantity(si.itemId, si.quantity + 1)}
                    >+</button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(si.itemId)}
                    className="shrink-0 text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div className="text-xs text-right text-muted-foreground pt-1">
                Items total: <span className="font-semibold text-foreground">{formatCurrency(itemSum)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Add items from your menu</label>
            <input
              type="text"
              value={itemSearchQuery}
              onChange={(e) => setItemSearchQuery(e.target.value)}
              placeholder="Search items…"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="max-h-48 overflow-y-auto space-y-1 rounded-md border border-border p-1">
              {filteredItems.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {storeItems.length === 0 ? 'No active items in your store' : 'No items match'}
                </p>
              )}
              {filteredItems.map((item: any) => {
                const already = selectedItems.some((si) => si.itemId === item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={already}
                    onClick={() => addItem(item)}
                    className={`w-full text-left flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
                      already ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'
                    }`}
                  >
                    <span className="line-clamp-1">{item.title}</span>
                    <span className="shrink-0 ml-2 text-muted-foreground">{formatCurrency(Number(item.price))}</span>
                    {!already && <Plus className="h-3.5 w-3.5 ml-2 shrink-0 text-primary" />}
                  </button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pricing strategy</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PRICING_TYPES.map((pt) => (
              <button
                key={pt.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, pricingType: pt.value }))}
                className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors text-center ${
                  form.pricingType === pt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {pt.label}
              </button>
            ))}
          </div>

          {(form.pricingType === 'FIXED_PRICE' || form.pricingType === 'BEST_DEAL') && (
            <div>
              <label className="block text-sm font-medium mb-1">Fixed price ($)</label>
              <input
                type="number" min="0" step="0.01"
                value={form.fixedPrice}
                onChange={(e) => setForm((f) => ({ ...f, fixedPrice: e.target.value }))}
                placeholder="e.g. 24.99"
                className="w-full max-w-xs rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          {(form.pricingType === 'DISCOUNT_PERCENT' || form.pricingType === 'BEST_DEAL') && (
            <div>
              <label className="block text-sm font-medium mb-1">Discount (%)</label>
              <input
                type="number" min="0" max="100" step="0.1"
                value={form.discountPercent}
                onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))}
                placeholder="e.g. 15"
                className="w-full max-w-xs rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          {(form.pricingType === 'DISCOUNT_AMOUNT' || form.pricingType === 'BEST_DEAL') && (
            <div>
              <label className="block text-sm font-medium mb-1">Discount amount ($)</label>
              <input
                type="number" min="0" step="0.01"
                value={form.discountAmount}
                onChange={(e) => setForm((f) => ({ ...f, discountAmount: e.target.value }))}
                placeholder="e.g. 5.00"
                className="w-full max-w-xs rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center gap-3">
              <input
                id="showSavings"
                type="checkbox"
                checked={form.showSavings}
                onChange={(e) => setForm((f) => ({ ...f, showSavings: e.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
              <label htmlFor="showSavings" className="text-sm">Show savings badge to customers</label>
            </div>
            {form.showSavings && (
              <div>
                <label className="block text-sm font-medium mb-1">Badge label (optional)</label>
                <input
                  type="text"
                  value={form.savingsLabel}
                  onChange={(e) => setForm((f) => ({ ...f, savingsLabel: e.target.value }))}
                  placeholder='e.g. "Save $5!" — leave blank for auto'
                  className="w-full max-w-xs rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}
          </div>

          {selectedItems.length > 0 && (
            <div className="rounded-lg bg-muted/50 px-4 py-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items sum</span>
                <span>{formatCurrency(itemSum)}</span>
              </div>
              {preview != null && (
                <>
                  <div className="flex justify-between font-semibold">
                    <span>Bundle price</span>
                    <span className="text-success">{formatCurrency(Math.max(0, preview))}</span>
                  </div>
                  {savings != null && savings > 0.005 && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Customer saves</span>
                      <span className="text-success font-medium">{formatCurrency(savings)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => navigate(`/vendor/stores/${storeId}/bundles`)}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={!canSave || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending
            ? isEditing ? 'Saving…' : 'Creating…'
            : isEditing ? 'Save changes' : 'Create bundle'}
        </Button>
      </div>
    </PageShell>
  )
}
