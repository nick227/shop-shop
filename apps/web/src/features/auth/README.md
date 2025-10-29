# Auth Feature

## Overview
Handles user authentication, registration, and form management for the application.

## Public API
- `LoginForm` - User login form component
- `SignupForm` - User registration form component
- `createItemFormSections` - Form sections for item creation
- `createStoreFormSections` - Form sections for store creation

## Boundaries
- **Can import from**: `@shared/*`, `@api/*`
- **Cannot import from**: Other features, pages, layouts
- **Exports**: Forms, form utilities, auth-related components

## Structure
- `components/` - LoginForm, SignupForm
- `hooks/` - Feature-specific hooks (empty)
- `services/` - Business logic services (empty)
- `stores/` - Feature-local stores (empty)
- `testing/` - Test builders/fakes (empty)
- `types/` - Feature-specific types (empty)
