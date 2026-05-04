/**
 * Component Props - Generic component prop type definitions
 * 
 * These types provide consistent prop interfaces for reusable components
 * across the application.
 */

import type { ReactNode, CSSProperties, HTMLAttributes } from 'react'
import type { AddressResponse as Address } from '@api/types'

// ============================================
// Base Component Props
// ============================================

/** Location coordinates for maps and location-based components */
export interface LocationCoordinates {
  latitude: number
  longitude: number
}

/** Base props for all components */
export interface BaseProps {
  className?: string
  style?: CSSProperties
  children?: ReactNode
  id?: string
  'data-testid'?: string
}

/** Props for clickable elements */
export interface ClickableProps extends BaseProps {
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
}

/** Props for interactive elements */
export interface InteractiveProps extends ClickableProps {
  onHover?: () => void
  onFocus?: () => void
  onBlur?: () => void
  tabIndex?: number
}

// ============================================
// Entity Component Props
// ============================================

/** Base props for entity cards */
export interface EntityCardProps<T = any> extends BaseProps {
  entity: T
  onClick?: (entity: T) => void
  onEdit?: (entity: T) => void
  onDelete?: (entity: T) => void
  actions?: ReactNode
  loading?: boolean
  error?: string
}

/** Base props for entity lists */
export interface EntityListProps<T = any> extends BaseProps {
  items: T[]
  loading?: boolean
  error?: string
  emptyMessage?: string
  onItemClick?: (item: T) => void
  onItemEdit?: (item: T) => void
  onItemDelete?: (item: T) => void
  renderItem?: (item: T) => ReactNode
  itemKey?: (item: T) => string
}

/** Base props for entity modals */
export interface EntityModalProps<T = any> extends BaseProps {
  entity?: T
  isOpen: boolean
  onClose: () => void
  onSave?: (entity: T) => void
  onDelete?: (entity: T) => void
  loading?: boolean
  error?: string
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

// ============================================
// Form Component Props
// ============================================

/** Base form props */
export interface FormProps<T = unknown> extends BaseProps {
  onSubmit: (data: T) => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
  error?: string
  disabled?: boolean
  initialData?: T
}

/** Form field props */
export interface FormFieldProps<T = unknown> extends BaseProps {
  name: string
  label?: string
  placeholder?: string
  value: T
  onChange: (value: T) => void
  error?: string
  disabled?: boolean
  required?: boolean
  type?: string
  options?: { value: T; label: string }[]
}

/** Form section props */
export interface FormSectionProps extends BaseProps {
  title: string
  description?: string
  collapsible?: boolean
  defaultExpanded?: boolean
  children: ReactNode
}

// ============================================
// Page Component Props
// ============================================

/** Base page props */
export interface PageProps extends BaseProps {
  title?: string
  description?: string
  loading?: boolean
  error?: string
  breadcrumbs?: { label: string; href?: string }[]
  actions?: ReactNode
}

/** Section props */
export interface SectionProps extends BaseProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
  children: ReactNode
}

// ============================================
// State Component Props
// ============================================

/** Loading state props */
export interface LoadingProps extends BaseProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

/** Error state props */
export interface ErrorProps extends BaseProps {
  title?: string
  message?: string
  onRetry?: () => void
  showRetry?: boolean
}

/** Empty state props */
export interface EmptyProps extends BaseProps {
  title?: string
  message?: string
  icon?: ReactNode
  action?: ReactNode
}

/** Data state props */
export interface DataStateProps<T = unknown> extends Omit<BaseProps, 'children'> {
  data: T
  loading?: boolean
  error?: string
  emptyMessage?: string
  onRetry?: () => void
  children: (data: T) => ReactNode
}

// ============================================
// Store Component Props
// ============================================

/** Store card props */
export interface StoreCardProps extends EntityCardProps {
  showDistance?: boolean
  showRating?: boolean
  showFees?: boolean
  compact?: boolean
}

/** Store list props */
export interface StoreListProps extends EntityListProps {
  showDistance?: boolean
  showRating?: boolean
  showFees?: boolean
  sortBy?: 'distance' | 'name' | 'rating'
  filterBy?: string
}

/** Store modal props */
export interface StoreModalProps extends EntityModalProps {
  showMap?: boolean
  showItems?: boolean
  showReviews?: boolean
}

// ============================================
// Item Component Props
// ============================================

/** Item card props */
export interface ItemCardProps extends EntityCardProps {
  showPrice?: boolean
  showStock?: boolean
  showStore?: boolean
  compact?: boolean
  imageSize?: 'sm' | 'md' | 'lg'
}

/** Item list props */
export interface ItemListProps extends EntityListProps {
  showPrice?: boolean
  showStock?: boolean
  showStore?: boolean
  sortBy?: 'name' | 'price' | 'category'
  filterBy?: string
  category?: string
}

/** Item modal props */
export interface ItemModalProps extends EntityModalProps {
  showImages?: boolean
  showVariants?: boolean
  showReviews?: boolean
  allowAddToCart?: boolean
}

// ============================================
// Order Component Props
// ============================================

/** Order card props */
export interface OrderCardProps extends EntityCardProps {
  showStatus?: boolean
  showTotal?: boolean
  showDate?: boolean
  showItems?: boolean
  compact?: boolean
}

/** Order list props */
export interface OrderListProps extends EntityListProps {
  showStatus?: boolean
  showTotal?: boolean
  showDate?: boolean
  sortBy?: 'date' | 'status' | 'total'
  filterBy?: string
  status?: string
}

/** Order modal props */
export interface OrderModalProps extends EntityModalProps {
  showTimeline?: boolean
  showItems?: boolean
  showAddress?: boolean
  allowStatusUpdate?: boolean
}

// ============================================
// Address Component Props
// ============================================

/** Address card props */
export interface AddressCardProps extends EntityCardProps {
  showDefault?: boolean
  showActions?: boolean
  compact?: boolean
}

/** Address list props */
export interface AddressListProps extends EntityListProps {
  showDefault?: boolean
  showActions?: boolean
  allowSelection?: boolean
  selectedId?: string
  onSelect?: (address: Address) => void
}

/** Address modal props */
export interface AddressModalProps extends EntityModalProps {
  showMap?: boolean
  allowGeocoding?: boolean
  showValidation?: boolean
}

// ============================================
// Map Component Props
// ============================================

/** Map props */
export interface MapProps extends BaseProps {
  center?: { lat: number; lng: number }
  zoom?: number
  markers?: {
    id: string
    position: { lat: number; lng: number }
    title?: string
    onClick?: () => void
  }[]
  onMapClick?: (position: { lat: number; lng: number }) => void
  onMarkerClick?: (marker: { id: string; position: [number, number]; data?: unknown }) => void
  height?: string | number
  interactive?: boolean
}

/** Map marker props */
export interface MapMarkerProps extends BaseProps {
  position: { lat: number; lng: number }
  title?: string
  onClick?: () => void
  icon?: string | ReactNode
  color?: string
  size?: 'sm' | 'md' | 'lg'
}

// ============================================
// Search Component Props
// ============================================

/** Search props */
export interface SearchProps extends BaseProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onSearch?: (query: string) => void
  onClear?: () => void
  loading?: boolean
  suggestions?: string[]
  onSuggestionClick?: (suggestion: string) => void
  debounceMs?: number
}

/** Search results props */
export interface SearchResultsProps<T = unknown> extends BaseProps {
  query: string
  results: T[]
  loading?: boolean
  error?: string
  onResultClick?: (result: T) => void
  renderResult?: (result: T) => ReactNode
  emptyMessage?: string
}

// ============================================
// Pagination Component Props
// ============================================

/** Pagination props */
export interface PaginationProps extends BaseProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
  showPrevNext?: boolean
  maxVisiblePages?: number
  disabled?: boolean
}

// ============================================
// Breadcrumb Component Props
// ============================================

/** Breadcrumb props */
export interface BreadcrumbProps<T = unknown> extends BaseProps {
  items: {
    label: string
    href?: string
    active?: boolean
  }[]
  separator?: ReactNode
  onItemClick?: (item: T) => void
}

// ============================================
// Status Badge Component Props
// ============================================

/** Status badge props */
export interface StatusBadgeProps extends BaseProps {
  status: string
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  customColor?: string
}

// ============================================
// Stat Card Component Props
// ============================================

/** Stat card props */
export interface StatCardProps extends BaseProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease' | 'neutral'
    period?: string
  }
  icon?: ReactNode
  color?: string
  loading?: boolean
}

// ============================================
// Dialog Component Props
// ============================================

/** Confirm dialog props */
export interface ConfirmDialogProps extends BaseProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

/** Drawer props */
export interface DrawerProps extends BaseProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  position?: 'left' | 'right' | 'top' | 'bottom'
  children: ReactNode
  footer?: ReactNode
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}