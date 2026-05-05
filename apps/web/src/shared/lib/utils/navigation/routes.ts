import { createItemSlug, createStoreSlug } from '../slugify'

interface StoreRouteInput {
  id: string
  name: string
}

interface ItemRouteInput {
  id: string
  title: string
}

export function getStoreRoute({ id, name }: StoreRouteInput): string {
  const slug = createStoreSlug(name, id)
  return `/kitchen/${slug}`
}

export function getItemRouteSimple({ id, title: _title }: ItemRouteInput): string {
  return `/items/${id}`
}
