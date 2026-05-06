/** Passthrough list queries can include arbitrary keys; Prisma Item only accepts model fields. */
const ITEM_LIST_WHERE_KEYS = new Set([
  'id',
  'storeId',
  'title',
  'description',
  'price',
  'isActive',
  'isSoldOut',
  'sortIndex',
  'stockQty',
  'isVegan',
  'isVegetarian',
  'isGlutenFree',
  'isDairyFree',
  'spicyLevel',
  'createdAt',
  'updatedAt',
])

const BOOL_KEYS = new Set([
  'isActive',
  'isSoldOut',
  'isVegan',
  'isVegetarian',
  'isGlutenFree',
  'isDairyFree',
])

/** Valid UUID @db.Char(36); use in `{ in: [...] }` when no rows should match. */
export const NIL_UUID = '00000000-0000-0000-0000-000000000000'

export function sanitizeItemListWhere(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of ITEM_LIST_WHERE_KEYS) {
    if (!(key in raw) || raw[key] === undefined) continue
    let v = raw[key]
    if (BOOL_KEYS.has(key)) {
      if (v === 'true') v = true
      else if (v === 'false') v = false
    }
    out[key] = v
  }
  return out
}
