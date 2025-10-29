# API Layer

This directory contains the SDK-first API layer that provides a clean, consistent interface for all API operations.

## Structure

```
api/
├── client-adapter.ts      # Main SDK wrapper - single import point
├── queries/               # Read operations (feature-agnostic)
├── mutations/             # Write operations (feature-agnostic)
├── hooks/                 # React Query hooks
├── adapters/              # Validation schemas and transformers
├── generated/             # Generated types and files (never import directly)
├── errors/                # Error handling utilities
└── client.ts              # Low-level SDK client (legacy)
```

## Usage

### For Features (Recommended)

```typescript
// Import from the main API module
import { api, useStores, createStore } from '@api'

// Use the adapter for direct API calls
const stores = await api.stores.getAllStores()

// Use React Query hooks
const { data: stores, isLoading } = useStores()

// Use mutation functions
const createStoreMutation = useMutation({
  mutationFn: createStore
})
```

### For Pages/Layouts (Discouraged)

Pages and layouts should not import directly from `@api/*`. Instead, they should use feature hooks and components that encapsulate API logic.

## Key Principles

1. **SDK-First**: All operations go through the generated SDK
2. **Feature-Agnostic**: Queries and mutations are not tied to specific features
3. **Type Safety**: Zod validation at the API boundary
4. **Consistent Error Handling**: Unified error handling across all operations
5. **React Query Integration**: Optimized caching and state management

## Boundaries

- **Can import from**: `@packages/sdk` (generated SDK)
- **Cannot import from**: `@features/*`, `@pages/*`, `@layouts/*`
- **Should be imported by**: `@features/*` only

## Migration Notes

- Legacy `apiWrapper` is still available as `legacyApi` for backward compatibility
- Generated files are in `api/generated/` and should never be imported directly
- All new code should use the new `api` adapter and React Query hooks
