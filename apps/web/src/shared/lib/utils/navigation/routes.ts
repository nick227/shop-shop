import { createItemSlug } from '../slugify'

interface StoreRouteInput {
  id: string
  name: string
}

interface ItemRouteInput {
  id: string
  title: string
}

export function getStoreRoute({ id }: StoreRouteInput): string {
  return `/store/${id}`
}

export function getItemRouteSimple({ id, title }: ItemRouteInput): string {
  const slug = createItemSlug(title, id)
  return slug ? `/items/${slug}-${id}` : `/items/${id}`
}
