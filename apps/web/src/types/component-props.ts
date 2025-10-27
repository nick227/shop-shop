/**
 * Generic Component Props
 * Reduces 61+ Props interfaces to ~10 reusable generic types
 */

import type { ReactNode, MouseEvent, FocusEvent } from 'react'
import type { StoreWithDistance } from '@api/types'

// Import SDK response types directly
import type { 
  ItemResponse, 
  OrderResponse, 
  AddressResponse
} from '@packages/sdk'

// Location coordinate type derived from SDK
export interface LocationCoordinates {
  latitude: number
  longitude: number
}

// ========================================
// Base Generic Props
// ========================================

// Helper type for entities with ID - flexible for different ID keys
export interface WithId {
  id: string
}

// Alternative ID key support
export type WithIdKey<K extends string = 'id'> = Record<K, string>

// Centralized variant unions to prevent drift
export type CardVariant = 'standard' | 'compact' | 'expanded'
export type SizeVariant = 'small' | 'medium' | 'large'
export type StatusVariant = 'success' | 'warning' | 'error' | 'info'
export type LayoutVariant = 'grid' | 'list'
export type DrawerSize = SizeVariant | 'full'

export interface BaseProps {
  className: string | undefined
  children: ReactNode | undefined
}

export interface ClickableProps<T extends HTMLElement = HTMLElement> extends BaseProps {
  onClick: ((event: MouseEvent<T>) => void) | undefined
  disabled: boolean | undefined
}

export interface InteractiveProps<T extends HTMLElement = HTMLElement> extends ClickableProps<T> {
  onMouseEnter?: (event: MouseEvent<T>) => void
  onMouseLeave?: (event: MouseEvent<T>) => void
  onFocus?: (event: FocusEvent<T>) => void
  onBlur?: (event: FocusEvent<T>) => void
}

// Focusable element constraints
export type FocusableElement = HTMLButtonElement | HTMLAnchorElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

// ========================================
// Entity-Specific Props
// ========================================

export interface EntityCardProps<T> extends ClickableProps {
  entity: T
  variant?: CardVariant
  showDetails?: boolean
}

export interface EntityListProps<T extends WithId> extends BaseProps {
  entities: T[]
  onEntityClick?: (entity: T) => void
  isHighlighted?: (entity: T) => boolean
  emptyMessage?: string
}

export interface EntityModalProps<T> extends BaseProps {
  entity?: T
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (entity: T) => void | Promise<void>
  mode: 'create' | 'edit'
  // Accessibility hooks
  ariaLabelledBy?: string
  ariaDescribedBy?: string
  role?: 'dialog' | 'alertdialog'
}

// ========================================
// Form Props
// ========================================

export interface FormProps<T> extends BaseProps {
  data: T
  onSubmit: (data: T) => void | Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  errors?: FormErrors<T>
}

export interface FormFieldProps<T> extends BaseProps {
  name: keyof T
  label: string
  required?: boolean
  error?: string
  helperText?: string
}

// Improved form error typing for nested paths
export type FormErrors<T> = {
  [K in keyof T]?: T[K] extends object 
    ? T[K] extends (infer U)[]
      ? FormErrors<U>[]
      : FormErrors<T[K]>
    : string
}

// ========================================
// Layout Props
// ========================================

export interface PageProps extends BaseProps {
  title: string
  subtitle?: string
  backLink?: { href: string; label: string }
  actions?: ReactNode
}

export interface SectionProps extends BaseProps {
  title: string
  icon?: ReactNode
  subtitle?: string
  actions?: ReactNode
}

// ========================================
// State Props
// ========================================

export interface LoadingProps extends BaseProps {
  message?: string
  size?: SizeVariant
}

export interface ErrorProps extends BaseProps {
  title?: string
  message: string
  error?: ApiError
  onRetry?: () => void
}

export interface EmptyProps extends BaseProps {
  title?: string
  message: string
  icon?: ReactNode
  action?: ReactNode
}

// ========================================
// Data Props
// ========================================

// Shared error type
export interface ApiError {
  message: string
  code?: string
  details?: Record<string, unknown>
}

// Discriminated union for data state
export type DataState<T> = 
  | { status: 'loading' }
  | { status: 'error'; error: ApiError; onRetry?: () => void }
  | { status: 'success'; data: T[] }
  | { status: 'empty'; emptyMessage?: string }

export interface DataStateProps<T> extends BaseProps {
  state: DataState<T>
}

// ========================================
// Specific Entity Props (Type Aliases)
// ========================================

export type StoreCardProps = EntityCardProps<StoreWithDistance>
export type StoreListProps = EntityListProps<StoreWithDistance>
export type StoreModalProps = EntityModalProps<StoreWithDistance>

export type ItemCardProps = EntityCardProps<ItemResponse>
export type ItemListProps = EntityListProps<WithId & ItemResponse>
export type ItemModalProps = EntityModalProps<ItemResponse>

export type OrderCardProps = EntityCardProps<OrderResponse>
export type OrderListProps = EntityListProps<WithId & OrderResponse>
export type OrderModalProps = EntityModalProps<OrderResponse>

export type AddressCardProps = EntityCardProps<AddressResponse>
export type AddressListProps = EntityListProps<WithId & AddressResponse>
export type AddressModalProps = EntityModalProps<AddressResponse>

// ========================================
// Map Props (Using SDK Types)
// ========================================

// Shared map callback type
export type StoreClickCallback = (store: StoreWithDistance) => void

export interface MapProps extends BaseProps {
  stores: StoreWithDistance[]
  userLocation?: LocationCoordinates
  radius?: number // Unit-agnostic radius
  radiusUnit?: 'miles' | 'kilometers' | 'meters'
  onStoreClick?: StoreClickCallback
}

export interface MapMarkerProps extends BaseProps {
  store: StoreWithDistance
  isNearest?: boolean
  onStoreClick?: StoreClickCallback
}

// ========================================
// Search Props
// ========================================

// Submit-based search (uncontrolled)
export interface SearchSubmitProps extends BaseProps {
  onSearch: (query: string) => void
  placeholder?: string
  showClearButton?: boolean
}

// Controlled input search
export interface SearchInputProps extends BaseProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  showClearButton?: boolean
}

// Union type for flexibility
export type SearchProps = SearchSubmitProps | SearchInputProps

export interface SearchResultsProps<T> extends BaseProps {
  results: T[]
  layout?: LayoutVariant
  cardVariant?: CardVariant
  onResultClick?: (result: T) => void
}

// ========================================
// Navigation Props
// ========================================

export interface PaginationProps extends BaseProps {
  currentPage: number // 1-based indexing, must be >= 1
  totalPages: number // must be >= 0
  pageSize?: number
  totalItems?: number
  onPageChange: (page: number) => void
  showInfo?: boolean
  // Zero-state handling
  emptyMessage?: string
  showEmptyState?: boolean
}

export interface BreadcrumbProps extends BaseProps {
  items: { 
    label: string
    href?: string
    ariaCurrent?: 'page' | 'step' | 'location' | 'date' | 'time' | true
  }[]
}

// ========================================
// Status Props
// ========================================

export interface StatusBadgeProps extends BaseProps {
  variant: StatusVariant
  showIcon?: boolean
}

export interface StatCardProps extends BaseProps {
  icon?: ReactNode
  value: string | number
  label: string
  trend?: 'up' | 'down' | 'neutral'
}

// ========================================
// Utility Props
// ========================================

export interface ConfirmDialogProps extends BaseProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  // Accessibility hooks
  role?: 'alertdialog' | 'dialog'
  ariaLabelledBy?: string
  ariaDescribedBy?: string
  destructive?: boolean // For destructive actions
}

export interface DrawerProps extends BaseProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  size?: DrawerSize
  // Accessibility hooks
  ariaLabelledBy?: string
  ariaDescribedBy?: string
}
