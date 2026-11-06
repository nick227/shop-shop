# Business pages

One renderer, `Storefront`, for both public business pages.

| Page | Route | Record | Commerce |
| --- | --- | --- | --- |
| Vendor storefront | `/kitchen/:slug` | `Store` | On. Menu, cart, item sheet. |
| Directory profile | `/directory/:slug` | `BusinessListing` | Off. Same shell, no ordering. |

`StoreDetail.page.tsx` mounts the storefront for a published store. `ListingProfile` mounts the same component with `commerce={false}` and an empty menu. A published listing whose `storeId` points at a store redirects to `/kitchen/:slug`. Do not build a second profile page. Add a section, or teach the directory adapter to fill a section the storefront already has.

Discovery cards are not this page. A directory row in the feed never opens `DetailPanel` and never shows a cart. Call, Directions, and Website live here.

## Two records

`Store` is a vendor account. A user owns it. It can take orders.

`BusinessListing` is a directory place. It may never sell on Shop-Shop. Ordering stays on `Store`.

| | Seeded or imported listing | Vendor store |
| --- | --- | --- |
| Table | `BusinessListing` | `Store` |
| Who creates it | Admin seed or name import. No user. | A vendor, in onboarding. |
| Owner | None | `ownerUserId`, plus team |
| Public URL | `/directory/:slug` | `/kitchen/:slug` |
| Goes live | `published` is false until an admin publishes it | `isPublished`, and `status` is `ACTIVE`. Readiness must pass. |
| Sells | Never, until an admin sets `storeId` | When `storeOrderingBlock` is null |
| Page config | None. `ListingProfile` builds a throwaway `StorefrontConfig`. | `StorefrontConfig`: draft JSON and published JSON |
| Menu, bundles, cart | No | Items, sections, bundles |
| Hours | Not stored. OSM `opening_hours` is dropped at import. | `hoursJson` |
| Photos | Admin URLs on `MediaAsset.listingId`. Seed writes none. | Store media, item media, mosaic |
| Email, social, posts | No columns | Confirmed email, `socialLinksJson`, `Post` |
| Payments | No | Stripe on the store |
| Link | Optional `storeId`, unique | Optional `directoryListing` |

Linking is admin-only, on the listing editor (`storeId`). One store, one listing. If both listings in a merge already point at different stores, the merge is refused. After a link, the directory URL is only a redirect. The vendor page is the public page.

## How a listing gets into the directory

Two writers, same table.

**Austin coverage seed** (`seedAustinCoverage`, admin “Seed Austin coverage”). Reads OpenStreetMap for named restaurants, cafes, bars, bakeries, shops, attractions, and parks inside the Austin box. Inserts `BusinessListing` rows with `source: osm`, `sourceId` like `node/123`, slug `austin-{name}-{sourceId}`, `published: false`. Skips a `sourceId` already stored. Then assigns ZIP and place. It does not create stores, users, items, or hours.

OSM fields kept: name, category, category label, phone, website, description (only when the element has `description`), street, city, state, ZIP, coordinates. Evidence of phone, website, or street is import metadata, not page copy.

OSM fields dropped: hours, cuisine, price, photos, social, email, wheelchair, outdoor seating. Do not invent them on the page.

**Name import** (`/admin/businesses/import`). An admin pastes names. Each name is looked up and classified: `READY` (one exact hit with a street), `REVIEW` (several or a weak match), `EXISTING` (already a listing, or the same name within 0.1 miles of a store), `NOT_FOUND`. Publishing an entry writes a listing. A match against a vendor store is marked existing and stores the `storeId` on the decision. It does not auto-link the listing unless the editor saves `storeId`.

Admin source listings have `source: admin` and no OSM attribution. OSM listings must keep `© OpenStreetMap contributors` on the public page.

Completeness is a count out of 7: street, city, ZIP, phone, website, description, coordinates. It sorts the admin list. It does not change the public page.

## How a vendor store gets a page

A vendor creates a `Store`. It stays off the public site until publish. `getStoreReadiness` requires name, description, phone or email, full address, coordinates, pickup or delivery, a delivery radius or active zone plus fee and minimum when delivery is on, one active item that is not sold out, a photo, and an active admin status. Hours, social links, tagline, and a custom storefront are not required to publish.

The storefront editor (`/vendor/:storeId/storefront`) edits presentation only: brand, mosaic, announcements, featured items and bundles, section order, menu layout. Saving a draft does not change the live page. Publish copies draft JSON to published JSON. Business facts (description, hours, address, phone, email, social) are store settings. They go live on save and are not part of the draft. The menu is items and sections, also live, not draft.

Team members with `MANAGE_STORE_SETTINGS` can edit the storefront. Draft preview is `GET /api/stores/:id/storefront?view=draft`. Everyone else gets published JSON, or defaults when the store has never published. A suspended or disabled store is a 404 to anyone outside the team.

## Current composition

Chrome is the shopping header. The storefront does not draw it. `stickyTop` is 60 so the menu bar sits under it.

Merchant order, from `Storefront.tsx`:

```
BusinessNavigation     back link and city › neighborhood › category › name
BusinessHeader         logo or initials, name, tagline, rating, address, Call, Directions, Website, Share
OrderingStrip          taking orders, open/closed, pickup, delivery
MenuBar                only when more than one section or more than 6 items
beforeMenu             mosaic, announcements, bundles, featured, category tiles
MenuSections           always, for a commerce page
afterMenu              about, gallery, updates
CartBar                live commerce only
ItemSheet              ?item= on the live page
```

Directory order is that shell with commerce off, then a block `ListingProfile` renders underneath the storefront: neighborhood links, up to 6 nearby listings within 2 miles, and OSM attribution when `source` is `osm`.

Empty sections return nothing. `Part` uses `empty:hidden`. A hidden optional section is invisible to shoppers. In the editor it is a dashed “Show” row.

Search in the menu bar replaces the before-menu and after-menu blocks with a match count. The menu stays.

## Variations that change what is on the page

| Condition | What changes |
| --- | --- |
| `commerce={false}` | No ordering strip, menu, cart, or item sheet. Header and about still render. |
| Listing has `store` | `/directory/:slug` redirects to the kitchen URL. The listing body is not shown. |
| No published storefront | Defaults from `defaultStorefrontConfig`: Market palette, modern font, light, auto layout, all sections visible, no tagline, auto-fill featured. |
| Tagline empty | Header uses the first two lines of `description`. About still shows the full description. |
| No logo | Initials on the brand color. A broken image does the same. Directory uses the first image URL as the logo. |
| `averageRating` missing | No star. Listings never have one. |
| Email unconfirmed | `publicStoreEmail` hides it, including in the vendor preview. |
| No hours | No open/closed control and no weekly list. Ordering can still be on. Checkout does not enforce hours. |
| Orders paused or blocked | “Not taking orders right now” plus the merchant note or `STORE_ORDERING_MESSAGES`. Add-to-cart toasts that message. |
| Pickup or delivery off, or delivery not ready | The strip still names both. The missing one says “not offered” or “not available right now”. |
| Fewer than 2 sections and 6 or fewer items | No sticky menu bar. |
| Fewer than 8 visible sections | No category tiles, even if that section is visible. |
| More than 6 sections | Menu bar adds a directory sheet. |
| More than 150 items, not searching | Long sections preview 8 or 9 items and offer “Show all”. |
| `presentation: auto` | 1–2 pictured items: large cards. A short pictured section: grid. Long or text-heavy: rows. `grid` and `list` force that layout. |
| Mosaic tiles empty | Up to 4 of the store’s own photos and videos, then pictured products not already in the carousel. Never a stock photo. |
| No pictures at all | Mosaic is omitted. Directory mosaic is on only when the listing has image URLs. |
| Featured pins empty and auto-fill on | Up to 8 orderable items, popular in the last 60 days, then pictured items. Products already in the carousel are left out of the Featured row. |
| Announcement, bundle, or gallery list empty | That block is omitted. |
| No posts | Updates section is omitted. A teammate with `MANAGE_ITEMS` or full access also sees `PostComposer`. |
| Menu search active | Merchandising and about/gallery/updates unmount until the query is cleared. |
| Editor preview | Map is omitted. Add-to-cart and bundles toast instead of writing a cart. Open item is local state, not `?item=`. |
| Directory category tone | Palette is fixed: food tomato, drink espresso, shop and outdoors and place market, arts harbor. Tagline is `categoryLabel`. Vendor palettes do not apply. |
| `source === 'osm'` | Attribution line under the profile. Admin-sourced listings have none. |
| Unpublished listing or non-public store | 404. The public page does not render a draft. |

Category on the breadcrumb comes from the store type group (`FOOD`, `GROCERY`, `CONVENIENCE`, `RETAIL`) or, for a listing, from `category`. Arts and outdoors are listing categories (`ATTRACTION`, `ENTERTAINMENT`, parks, libraries). They are not store types. `HOME_KITCHEN` is a store type inside Food. The page does not hide a home kitchen’s street address.

`featured` on a listing changes discovery (Member shops, directory sort). It does not change this page.

## Inventory

### On the page today

| Block | Merchant | Directory | Source |
| --- | --- | --- | --- |
| Breadcrumb | Yes | Yes | Address, place, store type or listing category |
| Name | Yes | Yes | Record |
| Tagline | Vendor text, else description | Category label | Config, or synthesized |
| Rating | If `averageRating` | No | Store aggregates |
| Address | Yes | Yes | Structured address |
| Call | If phone | If phone | Record |
| Directions | If coords or address | Same | Google Maps link |
| Website | `website` or `customDomain` | `website`, http(s) only | Record |
| Share | Yes | Yes | Current URL |
| Taking orders | Yes | No | `storeOrderingBlock` |
| Open now and weekly hours | If `hoursJson` | No | Hours service |
| Pickup and prep time | Yes | No | Store settings |
| Delivery | “fee shown at checkout” when available | No | Fulfillment service. No ETA. |
| Mosaic | Photos, video, product carousel | Images only, if any | Store media or listing URLs |
| Announcements | Up to 4: text, image, or video, optional item | No | Published config |
| Bundles | Active bundles whose items are all for sale | No | Bundle pricing |
| Featured products | Pinned, then popular | No | Config plus 60-day sales |
| Category tiles | 8 or more sections | No | Menu sections |
| Menu | Sections, search, sold-out state | Empty, and the empty state is not rendered because commerce is off | Items |
| Item sheet | Photos, price, description, dietary tags, quantity | No | Item |
| About | Description, phone, confirmed email, social | Description, phone. No email or social. | Record |
| Map | Live page, when coords exist | Same | `StorePreviewMap` |
| Gallery | Non-video store media | Listing images | Media |
| Updates | Store posts | No | River feed for that store |
| Cart | Live only | No | Cart for `store.id` |
| Neighborhood links | In the breadcrumb only | Also repeated under the page | Place and `ListingNeighborhood` |
| Nearby | No | 6 listings, 2 miles | Other published listings |
| Attribution | No | OSM only | `source` |

### Stored and not shown

On a store: `priceRange`, `companyName`, delivery minimum, delivery distance, tax category, tags other than dietary on the item sheet, brand color columns (the storefront palette wins). On a listing: latitude is used for the map and nearby, not printed. Import evidence and completeness are admin-only. OSM hours and cuisine are not stored, so they cannot be shown.

### Admin controls

`/admin/businesses` filters by name, city, ZIP, category, neighborhood, source, published. Bulk publish, unpublish, feature, unfeature. The editor writes name, category, category label, phone, website, description, address, image URLs, video URLs, published, featured, neighborhood links, per-neighborhood featured, and merchant id. Merge keeps the current listing’s text when it is non-empty and folds in media and neighborhood links. Place id is not editable in the form. It is sent back as the current `placeId`.

Vendors do not edit listing fields. Admins do not edit a store’s menu from the listing editor. They only attach `storeId`.

## Proposed content

Add these only when the record actually has the data. A missing field stays off the page. Do not generate a description, a rating, hours, or a photo.

Shared, both records:

- One hero. Cover photo distinct from the logo. Today the directory logo is the first photo.
- Status line that is honest: “Order on Shop-Shop” for a linked store, “Listed place” for a listing.
- Hours, once listings can store them. OSM `opening_hours` is the seed source. Until then the directory page has no hours block.
- Cuisine or shop tags, as chips. Store tags already exist. OSM `cuisine` is not imported yet.
- Price range, from `Store.priceRange` (`BUDGET`, `MODERATE`, `PREMIUM`). Listings have no equivalent.
- A short “In the neighborhood” row. Nearby already exists under the directory page. Move it into the storefront so a merchant page can show it too.
- Save. Discovery already saves stores. The business page does not.

Merchant only, behind commerce:

- Delivery area in words: radius or “selected neighborhoods”, plus minimum. Checkout still quotes the fee.
- Reorder from this shopper’s last order, when signed in.
- Sold-out and “back soon” on the tile, not only in the sheet.
- Bundle contents already render. A “what’s included” line on the mosaic is enough. No second bundle page.

Directory only, until a store is linked:

- Claim. A vendor starting onboarding from this listing should attach `storeId` and then the URL redirects. The claim flow does not exist.
- Photo menu or a posted menu image, not an orderable item. No cart.
- OSM attribution stays on the page for `source: osm`.

Worth storing before designing a block for it: listing hours, cuisine, a real cover separate from the logo, and social links on the listing. Skip reviews, popular times, awards, and staff until there is a table and a writer. A seeded page with only a name and a pin should still look finished: name, category, map, directions, nearby, attribution.

## Plan: one rich storefront

Keep `Storefront` as the only page. Give it a capability object instead of growing `commerce` into a second layout.

```
kind: 'store' | 'listing'
order: boolean          menu, cart, item sheet, ordering strip
posts: boolean          updates
claim: boolean          listing with no storeId
attribution: string | null
```

`kind` picks the adapter. The store adapter is `useStorefront` plus items, sections, and bundles. The listing adapter is `directoryData` in `ListingProfile`. Both return `StorefrontData` and a `StoreHeaderStore`. Sections already return null when empty. New blocks follow that rule.

Target order, top to bottom. Optional blocks drop out when empty. Search still hides everything except the menu.

```
navigation
hero                 cover, logo, name, category, neighborhood, status
actions              call, directions, website, share, save
facts                hours if known, price, cuisine or tags
ordering             only when order is true
mosaic               real media only
announcements        store config only
featured and bundles only when order is true
menu                 only when order is true
about                description, contact, social
map and hours list
gallery
updates              only when posts is true
nearby
attribution          listing, OSM only
claim                listing with no store
cart                 only when order is true
```

Work in this order:

1. Move nearby, neighborhood links, and attribution into `Storefront` so `ListingProfile` stops drawing a second footer. Pass them as data. Do not fetch the directory inside the storefront.
2. Stop using the listing’s first photo as the logo when a cover is wanted. Logo stays initials until a listing has a real logo field.
3. Show `priceRange` and store tags on the merchant hero. They are already on the store payload and currently unused here.
4. Import OSM `opening_hours` onto the listing and render the existing weekly hours component. No hours string, no block.
5. Add the status line and the claim link. Claim navigates to vendor onboarding with the listing id. Linking stays the admin `storeId` write until that flow exists.
6. Only then add a new section key. Extend `BeforeMenuSection` or `AfterMenuSection` in `packages/shared/src/storefront.ts`, the editor outline, and the `sections` map together. A key the editor cannot hide will surprise vendors. Directory pages ignore storefront draft JSON. Their visibility stays in `directoryConfig`.

Do not:

- Render a menu skeleton on a listing.
- Copy vendor palette editing onto seeded pages. Category tone is enough until a person claims the place.
- Show a rating, a review, or a stock photo because the section looks empty.
- Let a featured flag reorder this page.
- Publish seeded listings from the seed job. Publish stays an admin action.
