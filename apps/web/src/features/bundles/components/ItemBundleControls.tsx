/**
 * Item Bundle Controls Component
 * Adds bundle management controls to item cards
 */
import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { Button } from '@shared/ui/primitives'
import { Badge } from '@shared/ui/primitives'
import { useBundles } from '@api/hooks/generated'
import { useBundleManagement } from '../hooks/useBundleManagement'
import type { ItemResponse } from '@api/backend-types'
import type { BundleFormData } from '../types/bundle.types'

// Types
interface BundleItem {
  itemId: string
  quantity: number
  sortIndex: number
}

interface Bundle {
  id: string
  name: string
  description?: string
  imageUrl?: string
  isActive: boolean
  sortIndex: number
  items?: BundleItem[]
  pricing?: {
    pricingType: 'FIXED_PRICE' | 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BEST_DEAL'
    fixedPrice?: number
    discountPercent?: number
    discountAmount?: number
    minSavings?: number
    showSavings: boolean
    savingsLabel?: string
  }
}

interface ItemWithId {
  id: string
  title: string
  price?: string | number
}

interface ItemBundleControlsProps {
  readonly item: ItemWithId
  readonly storeId: string
  readonly onBundleCreated?: (bundle: Bundle) => void
  readonly className?: string
}

// Runtime type guards
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}
function isBundle(v: unknown): v is Bundle {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.isActive === 'boolean' &&
    typeof v.sortIndex === 'number'
  )
}
function isBundleArray(v: unknown): v is Bundle[] {
  return Array.isArray(v) && v.every((item) => isBundle(item))
}

// Utils
const toDollars = (v: string | number | undefined): number => {
  if (v === undefined) return 0
  if (typeof v === 'string') {
    // eslint-disable-next-line unicorn/prefer-string-replace-all
    const n = Number(v.replace(/[^\d.]/g, ''))
    return Number.isFinite(n) ? n : 0
  }
  // Treat large integers as cents
  return v > 100 && Number.isInteger(v) ? v / 100 : v
}

// Safe query result type guard
const isQueryResult = (value: unknown): value is { data?: unknown; refetch?: () => Promise<unknown> } => {
  return typeof value === 'object' && value !== null && ('data' in value || 'refetch' in value)
}

export function ItemBundleControls({
  item,
  storeId,
  onBundleCreated,
  className = ''
}: ItemBundleControlsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isCreatingBundle, setIsCreatingBundle] = useState(false)
  const [isAddingToBundle, setIsAddingToBundle] = useState<string | undefined>()
  const [error, setError] = useState<string | undefined>()
  const containerRef = useRef<HTMLDivElement>(null)

  // Safe access to query data/functions (avoid unsafe assignment/calls)
   
  const bundlesQueryResult = useBundles({ storeId }) as unknown
  const bundlesQuery = isQueryResult(bundlesQueryResult) ? bundlesQueryResult : undefined
  const bundlesData: unknown = bundlesQuery?.data
  const bundles: Bundle[] = useMemo(() => isBundleArray(bundlesData) ? bundlesData : [], [bundlesData])
  const refetchFn = bundlesQuery?.refetch

  const bundleManagement = useBundleManagement({ storeId })
  const createBundle = bundleManagement.createBundle as (data: BundleFormData) => Promise<unknown>
  const updateBundle = bundleManagement.updateBundle as (
    id: string,
    data: BundleFormData
  ) => Promise<unknown>

  // Close on Escape / click-outside
  useEffect(() => {
    if (!isDropdownOpen) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false)
        setError(undefined)
      }
    }
    const onClick = (e: globalThis.MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsDropdownOpen(false)
        setError(undefined)
      }
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onClick)
    }
  }, [isDropdownOpen])

    // Derived
  const itemId = item.id
  const availableBundles = useMemo(
    () => bundles.filter(b => !b.items?.some(i => i.itemId === itemId)),                                                                              
    [bundles, itemId]
  )

  const isInBundle = useMemo(
    () => bundles.some(b => b.items?.some(i => i.itemId === itemId)), 
    [bundles, itemId]
  )

  const handleAddToBundle = useCallback(
    async (bundle: Bundle) => {
      if (isAddingToBundle !== undefined) return
      setIsAddingToBundle(bundle.id)
      setError(undefined)
      try {
        const nextSortIndex =
          ((bundle.items?.reduce((m, it) => Math.max(m, it.sortIndex ?? -1), -1) ?? -1) + 1) || 0

                const updatedItems: BundleItem[] = [
          ...(bundle.items ?? []),
          { itemId: item.id, quantity: 1, sortIndex: nextSortIndex }   
        ]

        // Full shape (PUT-safe). Ensure pricing.showSavings exists per API.
        const body: BundleFormData = {
          name: bundle.name,
          description: bundle.description,
          imageUrl: bundle.imageUrl,
          isActive: bundle.isActive,
          sortIndex: bundle.sortIndex,
          pricing:
            bundle.pricing ?? { pricingType: 'FIXED_PRICE', fixedPrice: 0, showSavings: false },
          items: updatedItems
        }

        await updateBundle(bundle.id, body)
        if (refetchFn) {
          await refetchFn()
        }
                setIsDropdownOpen(false)
      } catch (error_: unknown) {
        console.error('Failed to add item to bundle:', error_)
        const message =
          error_ instanceof Error ? error_.message : 'Failed to add item to bundle. Please try again.'                                                          
        setError(message)
      } finally {
        setIsAddingToBundle(undefined)
      }
    },
    [isAddingToBundle, item.id, refetchFn, updateBundle]
  )

  const handleCreateNewBundle = useCallback(async () => {
    if (isCreatingBundle) return
    setIsCreatingBundle(true)
    setError(undefined)
    try {
      const priceValue =
        typeof item.price === 'string' || typeof item.price === 'number' ? item.price : undefined
      const base = toDollars(priceValue)
      const fixed = Math.max(0, Math.round(base * 0.9 * 100) / 100)

      const imageUrl = typeof (item as ItemResponse & { imageUrl?: string }).imageUrl === 'string'
        ? (item as ItemResponse & { imageUrl?: string }).imageUrl
        : undefined

            const createdUnknown = await createBundle({
        name: `${item.title} Bundle`,
        description: `Bundle featuring ${item.title}`,
        imageUrl,
        isActive: true,
        sortIndex: 0,
        items: [{ itemId: item.id, quantity: 1, sortIndex: 0 }],       
        pricing: {
          pricingType: 'FIXED_PRICE',
          fixedPrice: fixed,
          showSavings: true,
          savingsLabel: 'Save 10%'
        }
      })

      if (!isBundle(createdUnknown)) {
        throw new Error('Unexpected response creating bundle')
      }

      if (refetchFn) {
        await refetchFn()
      }

      const normalized: Bundle = {
        id: createdUnknown.id,
        name: createdUnknown.name,
        description: createdUnknown.description,
        imageUrl: createdUnknown.imageUrl,
        isActive: createdUnknown.isActive,
        sortIndex: createdUnknown.sortIndex,
        items: Array.isArray(createdUnknown.items) ? createdUnknown.items : [],
        pricing: createdUnknown.pricing
      }

      onBundleCreated?.(normalized)
      setIsDropdownOpen(false)
    } catch (error_: unknown) {
      console.error('Failed to create bundle:', error_)
      const message =
        error_ instanceof Error ? error_.message : 'Failed to create bundle. Please try again.'
      setError(message)
    } finally {
      setIsCreatingBundle(false)
    }
  }, [createBundle, isCreatingBundle, item, onBundleCreated, refetchFn])

  const handleQuickAdd = useCallback(
    (bundle: Bundle) => {
      void handleAddToBundle(bundle)
    },
    [handleAddToBundle]
  )

  return (
    <div ref={containerRef} className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Button
          size="small"
          variant="outline"
          disabled={isCreatingBundle || isAddingToBundle !== undefined}
          onClick={() => setIsDropdownOpen(o => !o)}
          aria-busy={isCreatingBundle || isAddingToBundle !== undefined}
          aria-label={isCreatingBundle ? 'Creating new bundle' : 'Add item to bundle'}
        >
          {isCreatingBundle ? 'Creating...' : 'Add to Bundle'}
        </Button>

        {isDropdownOpen && (
          <div
            className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4"
            role="dialog"
            aria-labelledby="add-to-bundle-title"
          >
            <div className="mb-4">
              <h4 id="add-to-bundle-title" className="text-base font-semibold text-gray-900 mb-2">
                Add to Bundle
              </h4>
              <p className="text-sm text-gray-600">Choose an existing bundle or create a new one</p>
            </div>

            {error !== undefined && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md" role="alert" aria-live="polite">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {availableBundles.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-semibold text-gray-900 mb-3">Existing Bundles</h5>
                <div className="space-y-2">
                  {availableBundles.map((bundle) => {
                    const disabled = isAddingToBundle === bundle.id
                    return (
                      <div
                        key={bundle.id}
                        role="button"
                        tabIndex={disabled ? -1 : 0}
                        aria-disabled={disabled}
                        className={`flex items-center justify-between p-3 border border-gray-200 rounded-md transition-all ${
                          disabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer hover:bg-gray-50 hover:border-blue-300'
                        }`}
                        onClick={() => !disabled && handleQuickAdd(bundle)}
                        onKeyDown={(e) => {
                          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault()
                            handleQuickAdd(bundle)
                          }
                        }}
                      >
                        <div>
                          <h6 className="text-sm font-semibold text-gray-900">{bundle.name}</h6>
                          <p className="text-xs text-gray-600">{bundle.items?.length ?? 0} items</p>
                        </div>
                        <Button
                          size="small"
                          variant="outline"
                          disabled={disabled}
                          aria-busy={disabled}
                          aria-label={disabled ? 'Adding item to bundle' : 'Add item to bundle'}
                          onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation()
                            if (!disabled) void handleAddToBundle(bundle)
                          }}
                        >
                          {disabled ? 'Adding...' : 'Add'}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-center gap-2">
              <Button
                size="small"
                variant="outline"
                onClick={() => {
                  setIsDropdownOpen(false)
                  setError(undefined)
                }}
                disabled={isCreatingBundle || isAddingToBundle !== undefined}
              >
                Cancel
              </Button>
              <Button
                size="small"
                onClick={() => { void handleCreateNewBundle() }}
                disabled={isCreatingBundle || isAddingToBundle !== undefined}
                aria-busy={isCreatingBundle}
              >
                {isCreatingBundle ? 'Creating...' : 'Create New Bundle'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {isInBundle && (
        <Badge variant="success">
          In Bundle
        </Badge>
      )}
    </div>
  )
}
