# Stores Feature

## Overview
Manages store discovery, display, and interaction functionality including maps, search, and store details.

## Public API
- `StoreCard` - Store display component
- `StoreMap` - Interactive store map
- `LocationSearch` - Store location search
- `FeaturedStores` - Featured stores carousel
- `NewestStores` - Newest stores display

## Boundaries
- **Can import from**: `@shared/*`, `@api/*`
- **Cannot import from**: Other features, pages, layouts
- **Exports**: Store components, store search functionality

## Structure
- `components/` - Store UI components
- `hooks/` - Store-related hooks (empty)
- `services/` - Store business logic (empty)
- `stores/` - Store state management (empty)
- `testing/` - Store test utilities (empty)
- `types/` - Store-specific types (empty)
