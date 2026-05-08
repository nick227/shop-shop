# Frontend Status Overview

## Purpose
This document summarizes the current frontend implementation, the features that are available today, and the remaining gaps in quality and completion. It is intended for developers onboarding to the project or triaging frontend work.

## Current Implementation Scope
The frontend is a React application built with Vite, React Router v6, TypeScript, and TanStack Query.

### Core application entry
- `src/App.tsx` initializes the app with:
  - `QueryClientProvider` for react-query
  - `RouterProvider` for client routing
  - `ErrorBoundary`
  - `Toaster` notifications
  - auth token sync to `apiClient`
  - view transitions setup

### Routing and page structure (`src/router.tsx`)
The current application supports:
- Public auth routes: `/login`, `/signup`
- Main authenticated storefront: `/`
- Search page: `/search`
- Kitchen detail pages: `/kitchen/:slug`
- Item detail pages: `/items/:itemId`
- Cart: `/cart`
- Checkout: `/checkout`
- Order history: `/orders`
- Order tracking: `/orders/:id`
- Store menu (auth, same as kitchen UI): `/menu`, `/menu/:storeId` — legacy redirect from `/river`

### Vendor portal
Vendor routes are under `/vendor` and include:
- Dashboard: `/vendor/dashboard`
- Store creation/edit: `/vendor/stores/new`, `/vendor/stores/:storeId/edit`
- Store items list: `/vendor/stores/:storeId/items`
- Item create/edit: `/vendor/stores/:storeId/items/new`, `/vendor/stores/:storeId/items/:itemId/edit`
- Vendor orders: `/vendor/orders`
- Store bundles: `/vendor/stores/:storeId/bundles` (and create/edit under `bundles/...`)

### Customer account portal
Customer account routes are under `/account` and include:
- Dashboard: `/account/dashboard`
- Orders: `/account/orders`
- Deliveries: `/account/deliveries`
- Profile: `/account/profile`
- Addresses: `/account/addresses`

## Functionality implemented today
### Strong foundation
- App-level composition and route protection are in place.
- Layout separation exists for main app, customer portal, and vendor portal.
- Shared UI primitives, form patterns, and query client configuration are established.
- Router structure is declarative and lazy-loads route pages for code splitting.

### Pages and experience
- Most storefront pages are present in `src/pages/public`, `src/pages/shared`, `src/pages/customer`, and `src/pages/vendor`.
- Customer profile and account pages have UI scaffolding and data-loading UX patterns.
- Vendor store/item management pages are wired into the router.
- Store detail and item detail pages are implemented with product and store view templates.
- Cart and checkout pages exist as route targets.

### API architecture
- There is an SDK-first approach with generated frontend types and type mappers in `src/api`.
- `apiClient` is used by query hooks and data access utilities.
- Some hooks are already using React Query with `useQuery` for state management.

## Known gaps and incomplete functionality
The frontend is not yet fully production-complete. Key gaps include:

### API integration gaps
- `src/features/search/hooks/useUnifiedSearch.ts` contains a mocked search implementation and does not call a real backend.
- `src/shared/hooks/hooks/river/useRiver.ts` returns an empty array until the River Posts API is available.
- `src/shared/hooks/hooks/usePostLike.ts` is marked as TODO in the OpenAPI integration path.
- `src/shared/hooks/hooks/useTip.ts` still contains TODO placeholders for tip creation, retrieval, processing, and refund flows.
- `src/shared/ui/ErrorBoundary.tsx` does not yet send captured errors to a reporting service.

### Purchase / checkout gaps
- `src/features/cart/components/CartDrawer/CartDrawer.tsx` has a checkout button with a placeholder handler and no real navigation or checkout action.
- `src/pages/customer/Profile.page.tsx` saves form edits locally but does not call an update profile API.

### Social / River experience
- `src/pages/shared/StoreDetail.page.tsx` has the River feed disabled in the UI pending the Posts API.
- Existing river-related hooks are placeholder stubs and do not render live social content yet.

### UX and polish
- Several advanced UX flows are scaffolded, but some are incomplete or intentionally disabled until backend work is finished.
- Search debouncing is described as future work in `useUnifiedSearch`.

## Overall quality assessment
### What is good today
- The frontend has a coherent route structure and a reasonable architectural baseline.
- There is a clear separation of public, customer, and vendor content.
- Shared UI primitives and composition patterns are already in place.
- The codebase contains strong documentation around migration, composition, design system, and SDK-first architecture.

### What needs work
- End-to-end feature completion is partial: many routes exist, but backend wiring is incomplete.
- Important commerce flows such as checkout and profile updates are not fully connected.
- Social and search experiences are currently mocked or disabled.
- Quality is uneven because the app is in a transition phase; code-level TODOs remain in several feature areas.

## Completion summary
- Structural completion: high
  - Routing, layouts, auth guard, query client, page scaffolding, and UI primitives are present.
- Feature completion: medium
  - Page presence is broad, but many features are still API stubs or partially implemented.
- Production readiness: low-to-medium
  - The app can be used as a prototype or staging environment, but the checkout, search, river, tip, and profile update paths require final backend integration and QA.

## Recommended next focus
1. Wire real search API integration and replace the mocked `useUnifiedSearch` response.
2. Complete checkout flow and cart-to-checkout navigation.
3. Implement profile update persistence on `/account/profile`.
4. Enable the River feed once the Posts API and related hooks are available.
5. Address tip flow TODOs and error reporting in the frontend.

## Document location
Created as `src/docs/FRONTEND_STATUS_OVERVIEW.md`.
