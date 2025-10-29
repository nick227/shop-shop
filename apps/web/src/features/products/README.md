# Products Feature

## Overview
Manages product and item display, interaction, and management functionality. Consolidated from items and products features.

## Public API
- `ProductCard` - Product display component
- `ItemCard` - Item display component
- `ItemCarouselCompact` - Compact item carousel

## Boundaries
- **Can import from**: `@shared/*`, `@api/*`
- **Cannot import from**: Other features, pages, layouts
- **Exports**: Product/item components, product management

## Structure
- `components/` - Product/item UI components
- `hooks/` - Product-related hooks (empty)
- `services/` - Product business logic (empty)
- `stores/` - Product state management (empty)
- `testing/` - Product test utilities (empty)
- `types/` - Product-specific types (empty)
