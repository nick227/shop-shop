/**
 * useStoreSearchWithTransformers — thin re-export of the canonical useStores hook.
 * Named exports satisfy the two import shapes used across the app:
 *   - `import { useStoreSearch } from '...useStoreSearchWithTransformers'`
 *   - `import { useStoreSearchWithTransformers } from '...useStoreSearchWithTransformers'`
 */
export { useStores as useStoreSearch, useStores as useStoreSearchWithTransformers } from './useStores'
