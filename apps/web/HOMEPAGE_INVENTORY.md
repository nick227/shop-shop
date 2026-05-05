# Homepage inventory & design direction

**Scope:** Authenticated route `/` implemented by `apps/web/src/pages/public/Home.page.tsx`  
**Product framing:** Local **store discovery + ordering** (delivery/pickup), not a generic property dashboard.  
**Phasing:** **Phase 1** = ship the core funnel (search → store → product → cart → checkout) with a **minimal home**; **Phase 2** = River / community (see `HomeRiverPlaceholder` on home).  
**Note:** A captured screenshot labeled “PropLog” / property-management UI does not match this repo’s branding (“Shop Shop”) or primary copy (food/restaurants). Treat that capture as **environment or build mismatch** unless you confirm the same deployment.

---

## Page intent (what this route is for)

The home page is the **primary entry after login**: users **set or confirm delivery location**, **search for stores**, and **browse curated entry points** (bundles, newest, featured, categories). It blends **marketing reassurance** (“why us”), **search tooling**, and **multiple browse surfaces** in one long scroll.

---

## Current on-page sections (top → bottom)

Order follows `Home.page.tsx` (Phase 1 — stripped):

| # | Section | Role |
|---|---------|------|
| 1 | **App header** (`PageComposition` `header` + `Header.tsx`) | Brand (“Shop Shop”), vendor CTA (“Sell”), optional location + radius chip |
| 2 | **URL / query errors** (`UrlParamError`) | Surfaces bad `lat`/`lng`/radius etc. from shareable URLs |
| 3 | **Hero** (`HeroSection`) | Dynamic headline/subhead from `usePromotionalCopy` |
| 4 | **Location search** (`LocationSearch`) | Geocode / radius / history |
| 5 | **Search results region** (`ResultsSection` → `ResultsContainer`) | Status, list/map, expand radius, empty states |
| 6 | **Available locations** (`AvailableLocations`) | When no location, geocode error, or no results — pick a city |
| 7 | **River placeholder** (`HomeRiverPlaceholder`) | Phase 2 — community feed (non-interactive copy only) |

**Deferred from home (re-add later if needed):** benefits grid, featured bundles, newest/featured store rails, category carousels.

**Global chrome:** root `Layout` also mounts `CartWidget` (floating cart entry).

**Layout fix:** `PageComposition` takes optional `header`; header slot no longer mirrors `children` in `<main>` (removes full-page duplication).

---

## Why the page used to feel like an “incoherent mess”

1. **Duplicate render (fixed):** `PageComposition` used to mirror `children` in both `<header>` and `<main>`. Use the **`header` prop** for the top bar; `children` render once in `<main>`.
2. **Competing jobs (reduced in Phase 1):** extra discovery rails and marketing blocks are **removed from home** until the funnel is solid.
3. **Copy vs. product drift:** `usePromotionalCopy` may still mix restaurant wording — align with **stores** when tightening copy.

---

## Main goals (3–5) for this homepage

These are the outcomes the page should optimize for, in priority order:

1. **Location + search success** — User quickly sets a valid service area and sees **relevant stores** (or a clear, actionable empty state).
2. **Start shopping** — From results or discovery rails, user can **open a store** and add items (path to cart/checkout).
3. **Trust & differentiation** — Short, scannable proof (benefits, social proof later if available) so users **feel safe ordering** from local vendors.
4. **Merchandising / revenue** — Highlight **bundles/deals** and featured inventory **without** burying search.
5. **Vendor acquisition (secondary)** — Single clear path for “Sell” / vendor onboarding without looking like the primary customer CTA.

*(Optional sixth: community / River / social — only if product strategy places it on home.)*

---

## Go-list: what *should* be on the homepage (agreed target)

Use this as the checklist for redesign implementation.

### Must-have (P0)

- [ ] **Single compositional shell** — One header, one main; no duplicated `children` in layout primitives.
- [ ] **Primary hero + one obvious primary action** — Location/search above the fold; headline supports that action (not a generic greeting wall).
- [ ] **Search results region** — Clear states: idle prompt, loading, results, no results with **expand radius** / **pick nearby city**.
- [ ] **Persistent cart access** — Visible affordance (existing `CartWidget` or equivalent).

### Should-have (P1)

- [ ] **One consolidated “Discover” block** — Combine or sequence **newest / featured / categories** with tabs or a single scroll module to avoid three separate “start here” areas.
- [ ] **Deals/bundles** — Keep when data exists; slot **after** first meaningful results or in a compact rail.
- [ ] **Benefits / trust row** — Reduced to **3** bullets or a horizontal strip; optional collapse on repeat visits.

### Could-have (P2)

- [ ] **Vendor CTA** — Secondary button in header/footer, not competing with search.
- [ ] **Light personalization** — e.g. “Order again” when order history exists (if API supports).

### Out-of-scope for homepage (unless product insists)

- Full account dashboard (`/account/dashboard`), order tracking, or admin-style metrics on `/`.

---

## Recommended layout / design direction

- **Information hierarchy:**  
  **Location/search → results OR guided empty state → one discovery module → optional deals → compact trust.**  
  Avoid repeating the hero or stacking multiple full-width marketing sections before the user has a location.
- **Visual system:**  
  Keep **one** strong background treatment (gradient or neutral); use **cards** for feeds so content boundaries read clearly on long scroll.
- **Density:**  
  Target **one screen** on mobile for: brand + search + first meaningful content (result card or “set location” CTA).
- **Copy alignment:**  
  Unify on **stores / local sellers / delivery** language in hero, benefits, and empty states (replace restaurant-only phrasing).

---

## Implementation pointers (for the next PR)

- Fix **`PageComposition`** so marketing layout renders **header slot vs main slot** from **distinct props or structured children**, not `{children}` three times.
- After structural fix, **re-evaluate section order** against the Go-list; remove or merge rails before adding new UI.

---

## Document status

- **Created:** 2026-05-04  
- **Source of truth for “current sections”:** `Home.page.tsx` as of this inventory.
