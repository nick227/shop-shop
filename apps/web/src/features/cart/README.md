# Cart Feature

## Overview
Manages shopping cart functionality including adding/removing items, cart persistence, and checkout preparation.

## Public API
- `CartDrawer` - Main cart drawer component
- `CartWidget` - Cart icon with item count
- `CartItem` - Individual cart item component
- `CartSummary` - Cart totals and checkout button

## Boundaries
- **Can import from**: `@shared/*`, `@api/*`
- **Cannot import from**: Other features, pages, layouts
- **Exports**: Cart components, cart state management

## Structure
- `components/` - Cart UI components
- `hooks/` - Cart-related hooks (empty)
- `services/` - Cart business logic (empty)
- `stores/` - Cart state management (empty)
- `testing/` - Cart test utilities (empty)
- `types/` - Cart-specific types (empty)
