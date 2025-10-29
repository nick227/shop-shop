# 🏗️ Frontend Reorganization Migration Plan

Applies to all client frontends under /src — merge before feature development resumes.

## **Overview**
This document outlines the complete migration plan to reorganize the frontend codebase for better structure, maintainability, and consistency. The goal is to create a clean separation between layouts, pages, and features while centralizing functionality and minimizing code exposure.

**Baseline**: Vite + React Router v6.28+, TypeScript, ESLint with boundaries plugin.

## ✅ Top Improvements (Do These First)

1) Folder ownership and boundaries
- Enforce one-way deps: pages → layouts → features → shared → api (api is lowest-level)
- Pages can import from @features and @shared; features never import from pages.
- Features import other features only via their public barrel (index.ts), never deep paths.
  - Pages never import from @api/* (they go through features only).
  - Layouts never import from @api/* or other features directly.
  - Shared never imports from features/pages/layouts.

2) Replace shared sprawl with clear subareas
- shared/ui, shared/form, shared/lib, shared/constants, shared/types, shared/hooks, shared/routing (optional).

3) Feature public API
- Each feature exposes features/<name>/index.ts (barrel). Ban deep imports across features.

4) Standardize file suffixes
- *.page.tsx (route), *.layout.tsx (layout), *.feature.ts (orchestration), *.service.ts (business logic), *.hook.ts (React hooks), *.ui.tsx (pure UI).

5) Co-locate tests/stories
- *.test.ts(x), *.stories.tsx next to code. Keep e2e under /e2e only.

6) API split + adapters (SDK isolation)
- api/queries/*, api/mutations/*, api/adapters/* (zod at boundaries), api/client-adapter.ts.
- Features import only api/queries|mutations or api/hooks, never generated/.
- Do not re-export generated types/hooks directly; expose curated wrappers from api/hooks for stability.

7) Design-system gate
- Generic UI lives in shared/ui. Product-specific UI lives in features/*/components.

8) Dependency rules (lint-enforced)
- ESLint boundaries: pages → layouts → features → shared. No reverse or cross-feature deep imports.

9) Route contracts
- Each page has a page.contract.ts (params/search schema via zod) and page.meta.ts (title, breadcrumbs). Optional loaders in pages/_loaders/ (pure, delegating to features).

10) Documentation + Migration hygiene
- Each layout has a README with allowed children/regions.
- Routing contracts documented in pages/README.md.
- Migration logs per phase with owner, timestamp, PR link. STRUCTURE.md diff per phase.

### Quick Reference: Import Aliases
Example import rules (do not import from @pages outside src/pages):
```typescript
// Absolute aliases (no relative paths beyond one level)
import { Button } from '@shared/ui'
import { useAuth } from '@features/auth'
import { StoreCard } from '@features/stores'
import { useStores } from '@api/queries'
```

## **🎯 Target Architecture**

```
src/
├── app/                          # Runtime composition, never imports from features
│   ├── router.tsx               # Main router configuration
│   ├── providers.tsx            # App providers
│   ├── config/                  # Env, flags, constants surfaced at runtime
│   ├── errors/                  # Error boundaries, fallbacks
│   ├── guards/                  # Route guards, no network
│   └── main.tsx                 # App entry point
│
├── shared/                      # Cross-app primitives
│   ├── ui/                      # Primitives only (buttons, inputs, modals)
│   ├── form/                    # Form primitives, schemas, resolvers
│   ├── lib/                     # Framework-agnostic utils (date, number, fp)
│   ├── constants/               # App-wide enums and constants
│   ├── types/                   # Global, non-domain types
│   ├── hooks/                   # Framework-level hooks only (media query, clipboard)
│   └── routing/                 # (optional) link builders, typed route helpers
│
├── layouts/                     # Structural only, no logic or network
│   ├── App.layout.tsx           # Main app layout
│   ├── Auth.layout.tsx          # Auth pages layout
│   ├── Vendor.layout.tsx        # Vendor portal layout
│   └── Customer.layout.tsx      # Customer portal layout
│
├── pages/                       # Declarative composition only
│   ├── public/                  # Public pages
│   │   ├── Home.page.tsx
│   │   ├── Login.page.tsx
│   │   └── Signup.page.tsx
│   ├── customer/                # Customer pages
│   │   ├── Dashboard.page.tsx
│   │   ├── Profile.page.tsx
│   │   └── Orders.page.tsx
│   ├── vendor/                  # Vendor pages
│   │   ├── Dashboard.page.tsx
│   │   ├── StoreForm.page.tsx
│   │   └── Orders.page.tsx
│   └── shared/                  # Shared pages
│       ├── StoreDetail.page.tsx
│       ├── ItemDetail.page.tsx
│       └── Cart.page.tsx
│
│   ├── _contracts/              # Single export surface for route contracts
│   └── _loaders/                # Route loaders/parsers must be pure (no network; delegate to features)
│
├── features/                    # Business logic + data
│   ├── auth/                    # Authentication feature
│   │   ├── components/
│   │   ├── hooks/               # Feature-specific hooks
│   │   ├── services/            # Business logic services
│   │   └── types/               # Feature-specific types
│   ├── stores/                  # Store management feature
│   ├── cart/                    # Shopping cart feature
│   ├── orders/                  # Order management feature
│   ├── search/                  # Search functionality
│   └── river/                   # Social feed feature
│
└── api/                        # Network + SDK boundary only (only features import from @api/*)
    ├── client-adapter.ts       # SDK wrapper adapter
    ├── queries/                # Read operations
    ├── mutations/              # Write operations
    ├── adapters/               # zod validation at the boundary
    ├── hooks/                  # Curated wrappers re-exported; do not leak codegen directly
    └── generated/              # Generated SDK (never imported directly)
```

## **📋 Migration Checklist**

### **Phase 1: Layout Consolidation**

- [ ] **Remove** `layouts/MobileShell/` → Move components to `shared/ui/`
- [ ] **Remove** `layouts/PageHeader/` → Move components to `shared/ui/`
- [ ] **Remove** `layouts/UnifiedLayout/` → Move components to `shared/ui/`
- [ ] **Rename** `layouts/MainLayout/` → `layouts/App.layout.tsx`
- [ ] **Keep** `layouts/VendorLayout/` → Simplify and keep
- [ ] **Keep** `layouts/CustomerLayout/` → Simplify and keep
- [ ] **Create** `layouts/Auth.layout.tsx` → For auth pages
- [ ] **Enforce** Layout responsibilities:
  - AppLayout: Main app wrapper with navigation
  - AuthLayout: Login/signup pages with minimal UI
  - VendorLayout: Vendor portal with sidebar navigation
  - CustomerLayout: Customer portal with top navigation

### **Phase 2: Page Reorganization**

- [ ] **Create** `pages/public/` directory
- [ ] **Create** `pages/customer/` directory
- [ ] **Create** `pages/vendor/` directory
- [ ] **Create** `pages/shared/` directory
- [ ] **Move** Public pages (rename suffixes):
  - `pages/HomePage.tsx` → `pages/public/Home.page.tsx`
  - `pages/LoginPage.tsx` → `pages/public/Login.page.tsx`
  - `pages/SignupPage.tsx` → `pages/public/Signup.page.tsx`
- [ ] **Move** Customer pages (rename suffixes):
  - `pages/CustomerDashboardPage/` → `pages/customer/Dashboard.page.tsx`
  - `pages/CustomerProfilePage/` → `pages/customer/Profile.page.tsx`
  - `pages/CustomerDeliveriesPage/` → `pages/customer/Deliveries.page.tsx`
  - `pages/CustomerAddressesPage/` → `pages/customer/Addresses.page.tsx`
  - `pages/OrderHistoryPage/` → `pages/customer/Orders.page.tsx`
  - `pages/OrderTrackingPage/` → `pages/customer/OrderTracking.page.tsx`
- [ ] **Move** Vendor pages (rename suffixes):
  - `pages/VendorDashboardPage/` → `pages/vendor/Dashboard.page.tsx`
  - `pages/StoreFormPage/` → `pages/vendor/StoreForm.page.tsx`
  - `pages/StoreItemsPage/` → `pages/vendor/StoreItems.page.tsx`
  - `pages/ItemFormPage/` → `pages/vendor/ItemForm.page.tsx`
  - `pages/VendorOrdersPage/` → `pages/vendor/Orders.page.tsx`
  - `pages/AdminCommissionPage/` → `pages/vendor/Commission.page.tsx`
- [ ] **Move** Shared pages (rename suffixes):
  - `pages/StoreDetailPage/` → `pages/shared/StoreDetail.page.tsx`
  - `pages/ItemDetailPage/` → `pages/shared/ItemDetail.page.tsx`
  - `pages/CartPage/` → `pages/shared/Cart.page.tsx`
  - `pages/CheckoutPage/` → `pages/shared/Checkout.page.tsx`
- [ ] **Remove** Duplicate pages:
  - `pages/StoreRiverPage/` (functionality moved to StoreDetailPage)
  - `pages/VendorStoreRiverPage/` (functionality moved to vendor pages)
  - `pages/examples/` (move to development docs)

### **Phase 3: Feature Cleanup**

- [ ] **Move** Page components to features:
  - `pages/HomePage/components/` → `features/home/components/`
  - `features/bundles/pages/VendorBundlesPage.tsx` → `pages/vendor/Bundles.page.tsx`
- [ ] **Merge** Related features:
  - `features/auth/` + `features/forms/` → `features/auth/`
  - `features/items/` + `features/products/` → `features/products/`
- [ ] **Keep** Separate features: `features/stores/`, `features/cart/`, `features/orders/`, `features/search/`, `features/river/`
- [ ] **Standardize** Feature structure (each feature):
  ```
  features/[feature-name]/
  ├── components/          # UI components
  ├── hooks/              # Feature-specific hooks
  ├── services/           # Business logic services
  ├── stores/             # Feature-local Zustand/Context stores
  ├── testing/            # Test builders/fakes (no cross-feature leakage)
  ├── types/              # Feature-specific types
  ├── index.ts           # Public exports
  └── README.md           # Feature boundary & public API contract
  ```

### **Phase 4: API Layer Reorganization**

- [ ] **Create** `api/client-adapter.ts` (wraps generated SDK; single import point)
- [ ] **Create** `api/queries/*` and `api/mutations/*` (feature-agnostic ops)
- [ ] **Create** `api/adapters/*` (zod validation at the boundary)
- [ ] **Move** `hooks/generated.ts` → `api/hooks/` (re-exported as public API)
- [ ] **Organize** Generated files under `api/generated/` (never imported outside api/)
- [ ] **Remove** Redundant API files:
  - `api/backend-types.ts` (use generated types)
  - `api/safe-types.ts` (use generated types)
  - `api/validation.ts` (use SDK validation)
  - `api/validators.ts` (use SDK validation)

### **Phase 5: Shared Components**

- [ ] **Move** Shared components:
  - `components/ui/` → `shared/ui/primitives/`
  - `components/composition/` → `shared/ui/layout/` (only if truly generic; otherwise move to `features/*/components`)
  - `components/ErrorBoundary.tsx` → `app/errors/ErrorBoundary.tsx`
  - `components/templates/` → `features/*/components` unless generic primitives
- [ ] **Move** Shared utilities:
  - `utils/` → `shared/lib/`
  - `types/` → `shared/types/` (non-SDK types only)
  - `constants/` → `shared/constants/`

### **Phase 6: Import & Dependency Updates**

- [ ] **Update** All import paths:
  - Layout imports
  - Page imports
  - Feature imports
  - Shared component imports
  - API imports
- [ ] **Fix** Circular dependencies:
  - Layout → Page dependencies
  - Feature → Feature dependencies
  - Shared → Feature dependencies
 - [ ] **Remove** multi-level `../../` relative paths; use absolute aliases only

### **Phase 7: Validation & Enforcement**

- [ ] **Configure** ESLint boundaries (see .eslintrc.cjs → boundaries.rules):
  - pages → layouts → features → shared → api (only forward)
  - features → other features via public index only
  - ban imports from api/generated outside api/
  - absolute aliases only; no ../../ climbing beyond one level
  - ban imports matching `**/features/**/**` except `**/features/*/index.ts`
  - ban `@api/generated/**` everywhere outside `api/`
  - ban `@pages/**` everywhere outside `src/pages/**`
- [ ] **Enforce** Naming & import rules:
  - No default exports in features
  - Standardized suffixes (*.page.tsx, *.layout.tsx, *.service.ts, *.hook.ts, *.ui.tsx)
 - [ ] **Add** Ownership rules:
   - CODEOWNERS for `features/*`, `shared/*`, `api/*`, `app/*`, `layouts/*`
- [ ] **Test** Functionality:
  - All pages load correctly
  - All layouts render properly
  - All features work as expected
  - All API calls function
  - All routing works
- [ ] **Validate** Code quality:
  - TypeScript compilation
  - ESLint checks
  - Build process
  - No console errors
- [ ] **Structure** Testing:
  - Co-locate *.test.ts(x) beside units. Keep e2e in /e2e
  - Add light smoke tests for every page (render + basic route param)

## **🔧 Implementation Strategy**

### **Step-by-Step Approach**
1. **Start with layouts** - least dependencies
2. **Move pages** - update imports as we go
3. **Reorganize features** - consolidate related functionality
4. **Clean up API layer** - centralize SDK usage
5. **Update all imports** - systematic find/replace
6. **Test everything** - ensure nothing breaks

### **Risk Mitigation**
- **Commit after each phase** (for rollback)
- **Run tests incrementally** to catch issues early
- **Update imports immediately** - avoid broken references
- **Keep backups** of original structure before moves

## **📝 Notes**

### **Key Principles**
1. **Pages = Routes**: Thin composition layers
2. **Features = Business Logic**: Self-contained modules
3. **Layouts = Structure**: Simple wrappers
4. **Shared = Reusable**: Common utilities
5. **API = SDK Integration**: Centralized SDK usage

### **What We're Preserving**
- All existing functionality
- Composition system (simplified)
- Routing structure (reorganized)
- SDK integration patterns

### **What We're Improving**
- File organization
- Import clarity
- Code reusability
- Maintainability
- Developer experience

## **🔧 Lifecycle & Automation**

### **Deletion/Merge Guidance**
- When merging features/items → features/products, keep a compat layer for one release (features/items/index.ts re-exporting from products), then remove.
- For removed pages, add explicit redirects in router and note in routing contracts doc.

### **Migration Logs**
- Keep a per-phase checklist with owner, timestamp, and PR link.
- Each phase ships a short STRUCTURE.md diff explaining what moved and why.
 - Maintain a Deprecation Map (old path → new path) for renamed/moved modules.
 - Require STRUCTURE.md in each `features/*` describing public API and boundaries.
 - For compat re-exports on renamed features, set a sunset date (e.g., +1 release) and remove on that date.

### **Automation**
- Add `scripts/structure:check` (lint + path checks) and `scripts/structure:smoke` (route smoke tests).
- Add root `ARCHITECTURE.md` summarizing dependency graph and linking per-folder READMEs.

## **✅ Success Criteria**

### **Structure Cleanliness**
- [ ] Clean separation between layouts, pages, and features
- [ ] Consistent structure across all modules
- [ ] No circular dependencies
- [ ] Clean import paths

### **Code Safety**
- [ ] All functionality working
- [ ] TypeScript compilation passes
- [ ] ESLint checks pass
- [ ] No console errors

### **Developer Ergonomics**
- [ ] Centralized SDK usage for API layer
- [ ] Clear feature boundaries with public APIs
- [ ] Co-located tests and stories
- [ ] Enforced dependency rules via lint

---

**Last Updated**: $(date +%Y-%m-%d)
**Status**: Planning Phase
**Next Step**: Begin Phase 1 - Layout Consolidation
