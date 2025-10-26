import { z } from 'zod'
import type { ReactNode } from 'react'

/**
 * Model-driven page configuration types;
 * Enables declarative page building with type safety;
 */

// ===== Action Config =====
export const ActionConfigSchema = z.object({
  label: z.string(),
  icon: z.string().optional(),
  variant: z.enum(['primary', 'secondary', 'outline', 'ghost', 'danger']).default('primary'),
  onClick: z.function().args(z.any()).returns(z.void()),
  disabled: z.boolean().optional(),
  loading: z.boolean().optional()})

export type ActionConfig = z.infer<typeof ActionConfigSchema>

// ===== Section Config =====
export const SectionConfigSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  actions: z.array(ActionConfigSchema).optional(),
  layout: z.enum(['grid', 'list', 'stack', 'carousel']).default('list'),
  cols: z.number().optional(), // For grid layout;
  gap: z.enum(['none', 'small', 'medium', 'large']).default('medium')})

export type SectionConfig = z.infer<typeof SectionConfigSchema>

// ===== Page Layout Config =====
export const PageLayoutConfigSchema = z.object({
  variant: z.enum(['default', 'mobile-shell', 'modal', 'split']).default('default'),
  showHeader: z.boolean().default(true),
  showBottomNav: z.boolean().default(false),
  title: z.string().optional(),
  backButton: z.boolean().default(false),
  actions: z.array(ActionConfigSchema).optional()})

export type PageLayoutConfig = z.infer<typeof PageLayoutConfigSchema>

// ===== Data State Config =====
export const DataStateConfigSchema = z.object({
  loadingMessage: z.string().optional(),
  errorMessage: z.string().optional(),
  emptyMessage: z.string().optional(),
  retryable: z.boolean().default(true),
  skeletonCount: z.number().default(3)})

export type DataStateConfig = z.infer<typeof DataStateConfigSchema>

// ===== Full Page Config =====
export interface PageConfig<TData = unknown> {
  layout: PageLayoutConfig;
  sections: SectionConfig[]
  dataState?: DataStateConfig;
  metadata?: {
    title: string;
    description?: string;
    testId?: string;
  }
}

// ===== View Config (for lists/grids) =====
export interface ViewConfig<TItem = unknown> {
  layout: 'grid' | 'list' | 'carousel'
  itemComponent: (item: TItem, index: number) => ReactNode;
  keyExtractor?: (item: TItem, index: number) => string | number;
  emptyState?: ReactNode;
  loadingState?: ReactNode;
  cols?: number;
  gap?: 'none' | 'small' | 'medium' | 'large'
}

// ===== Form Config =====
export const FormFieldConfigSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.enum(['text', 'email', 'password', 'number', 'tel', 'select', 'textarea']),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.object({
    value: z.string(),
    label: z.string()})).optional(), // For select fields;
})

export type FormFieldConfig = z.infer<typeof FormFieldConfigSchema>

export const FormConfigSchema = z.object({
  fields: z.array(FormFieldConfigSchema),
  submitLabel: z.string().default('Submit'),
  cancelLabel: z.string().optional(),
  onCancel: z.function().optional()})

export type FormConfig = z.infer<typeof FormConfigSchema>

