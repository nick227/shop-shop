/**
 * Bundle Mutations
 * 
 * All write operations related to bundles.
 * Feature-agnostic mutation functions.
 */

import { api } from '../client-adapter'
import type { CreateBundleInput, UpdateBundleInput, Bundle } from '@packages/sdk'

/**
 * Create bundle
 */
export async function createBundle(input: CreateBundleInput): Promise<Bundle> {
  const response = await api.bundles.createBundle(input)
  return response.data
}

/**
 * Update bundle
 */
export async function updateBundle(id: string, input: UpdateBundleInput): Promise<Bundle> {
  const response = await api.bundles.updateBundle(id, input)
  return response.data
}

/**
 * Delete bundle
 */
export async function deleteBundle(id: string): Promise<void> {
  await api.bundles.deleteBundle(id)
}
