export function isStorePublic(store: { isPublished?: boolean | null } | null | undefined): boolean {
  return store?.isPublished === true
}
