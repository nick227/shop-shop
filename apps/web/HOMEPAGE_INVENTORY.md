# Homepage inventory & design direction

**Scope:** Authenticated route `/` implemented by `apps/web/src/pages/public/Home.page.tsx`  
**Product framing:** Local **store discovery + ordering** (delivery/pickup), not a generic property dashboard.  
**Note:** A captured screenshot labeled “PropLog” / property-management UI does not match this repo’s branding (“Shop Shop”) or primary copy (food/restaurants). Treat that capture as **environment or build mismatch** unless you confirm the same deployment.

---

## Page intent (what this route is for)

The home page is the **primary entry after login**: users **set or confirm delivery location**, **search for stores**, and **browse curated entry points** (bundles, newest, featured, categories). It blends **marketing reassurance** (“why us”), **search tooling**, and **multiple browse surfaces** in one long scroll.

---

## Current on-page sections (top → bottom)

Order follows `Home.page.tsx` render tree:

| # | Section | Role |
|---|---------|------|
| 1 | **App header** (`features/home/components/Header.tsx`) | Brand (“Shop Shop”), vendor CTA (“Sell”), optional location + radius chip |
| 2 | **URL / query errors** (`UrlParamError`) | Surfaces bad `lat`/`lng`/radius etc. from shareable URLs |
| 3 | **Hero** (`HeroSection`) | Dynamic headline/subhead from `usePromotionalCopy` (time-of-day + store count) |
| 4 | **Location search** (`LocationSearch`) | Core action: geocode / radius / history |
| 5 | **Benefits** (`BenefitsSection`) | “Why Choose Us?” — six value bullets |
| 6 | **Featured bundles** (`FeaturedBundles`) | Carousel when active bundles exist; otherwise hidden |
| 7 | **Search results region** (`ResultsSection` → `ResultsContainer`) | Status, errors, geocoding message, list/map of stores for current search |
| 8 | **Newest stores** (`NewestStores`) | Always shown |
| 9 | **Available locations** (`AvailableLocations`) | When no location, geocode error, or empty results — pick a city |
| 10 | **Featured stores** (`FeaturedStores`) | Always shown |
| 11 | **Category carousels** (`StoreCategoryCarousels`) | Always shown |

**Global chrome:** root `Layout` also mounts `CartWidget` (floating cart entry).

---

## Why the page can feel like an “incoherent mess”

1. **Full duplicate render (high severity)**  
   `PageComposition.Marketing` (`shared/ui/composition/PageComposition.tsx`) injects the **same `children` into both** the composed `<header>` wrapper **and** `<main>`. Any page using this pattern will show **two copies** of everything (header + body stacked twice). This matches a “entire page repeats on scroll” symptom.
2. **Competing jobs on one scroll:** reassurance (benefits), primary task (search + results), and **three always-on discovery feeds** (newest, featured, categories) plus conditional geography fallback — many sections fight for attention without a single dominant funnel.
3. **Copy vs. product drift:** `usePromotionalCopy` still speaks **restaurants/food** in places; the rest of the app is **stores/items**. Mixed metaphors weaken clarity.
4. **Empty / redundant visual rhythm:** Multiple carousels and full-width purple gradient increase perceived length; sections that return `null` (e.g. no bundles) create uneven density.

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
