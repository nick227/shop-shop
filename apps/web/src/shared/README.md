# Shared Module

This directory contains cross-application primitives and utilities that can be used throughout the entire application.

## Structure

```
shared/
├── ui/                    # UI components and templates
│   ├── primitives/        # Basic UI components (Button, Input, etc.)
│   ├── composition/       # Composition components (LayoutComposition, etc.)
│   ├── layout/            # Layout components (PageTemplates, etc.)
│   ├── cards/             # Card components (StoreCard, ItemCard, etc.)
│   └── templates/         # Page templates (FormPageTemplate, etc.)
├── lib/                   # Utilities and helpers
│   ├── cn.ts             # Class name utility
│   ├── format.ts         # Formatting utilities
│   ├── validation/       # Validation utilities
│   └── ...               # Other utilities
├── types/                 # Shared TypeScript types
├── constants/             # Application constants
├── form/                  # Form utilities and validation
├── hooks/                 # Shared React hooks
├── guards/                # Route guards and protection
└── index.ts              # Main export file
```

## Usage

### Import from Shared Module

```typescript
// Import everything from shared
import { Button, useAuth, formatPrice, API_CONFIG } from '@shared'

// Or import specific modules
import { Button } from '@shared/ui/primitives'
import { useAuth } from '@shared/hooks'
import { formatPrice } from '@shared/lib'
```

### Import from Specific Paths

```typescript
// UI Components
import { Button, Input, Card } from '@shared/ui/primitives'
import { LayoutComposition, PageComposition } from '@shared/ui/composition'

// Utilities
import { cn, formatPrice, validateEmail } from '@shared/lib'

// Types
import type { User, Store, Order } from '@shared/types'

// Constants
import { API_CONFIG, PAGINATION } from '@shared/constants'

// Hooks
import { useAuth, useLocalStorage } from '@shared/hooks'
```

## Key Principles

1. **Cross-Application**: Can be used by any part of the application
2. **No Dependencies**: Should not depend on features, pages, or layouts
3. **Pure Functions**: Utilities should be pure and side-effect free
4. **Type Safety**: All exports should be properly typed
5. **Documentation**: All public APIs should be documented

## Boundaries

- **Can import from**: `@packages/sdk` (generated SDK)
- **Cannot import from**: `@features/*`, `@pages/*`, `@layouts/*`, `@api/*`
- **Should be imported by**: Any module that needs shared functionality

## Guidelines

### UI Components
- Keep components generic and reusable
- Use composition patterns for complex components
- Follow the design system guidelines
- Include proper TypeScript types

### Utilities
- Keep functions pure and side-effect free
- Include JSDoc documentation
- Add unit tests for complex logic
- Use consistent naming conventions

### Types
- Use descriptive names
- Include JSDoc comments for complex types
- Export both individual types and type unions
- Keep types focused and single-purpose

### Constants
- Use `as const` for type safety
- Group related constants together
- Use descriptive names
- Include comments for complex values
