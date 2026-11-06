# Discovery surface

One page, `DiscoveryPage`, for `/explore`, `/neighborhoods`, and `/neighborhoods/:slug`. Those three paths are children of one layout route in `router.tsx`, so a place change does not remount the page or flash the route loader. Category, search, and map are query changes on that same instance.

Do not add a second discovery page. Change the band list, the section map, or a container. `marketBlocks.ts` is unused. Ignore it.

## Current composition

Chrome sits outside the band list. Bands render in `discoveryBands` order. Empty sections return `null` and leave a hole, not a placeholder.

```
ShoppingChrome          header search, place label, cart
DiscoveryToolbar        city › zip|neighborhood › category › q, plus category buttons and Map
hero                    LocationHero: photo or map, title, lede, tags
neighborhoods           up to 4 PlaceCards (all of them on /neighborhoods)
shops                   MemberShops, up to 4, or nothing
personal                For you, or nothing
feed                    MarketFeed
categories              CategorySection
DetailPanel             overlay when a product, store, or story tile is open
```

`discoveryBands` currently ignores emphasis and always returns:

`hero → neighborhoods → shops → personal → feed → categories`

That stable order is intentional. A filter must not reorder the page.

## Change the order or add a band

1. Edit the returned array in `discoveryBands` (`discoveryMode.ts`). The `DiscoveryBand` union is the closed list.
2. Add a matching entry to the `sections` record in `DiscoveryPage.tsx`. TypeScript fails if a band has no section.
3. Keep the `Fragment key={band}` stable. A new key remounts that band and resets its local state.
4. A section that has nothing to show must return `null`. Do not render an empty band.

`emphasis` (`search` | `category` | `city` | `zip` | `neighborhood`) still exists. It no longer changes order. It only changes which store ids the feed hides (`excludeIds` is empty during search so a featured shop can also appear in results).

## URL state

`readDiscoveryContext` / `applyDiscoveryPatch` in `discoveryContext.ts`. Always patch. Do not hand-build the query.

| Param | Effect |
| --- | --- |
| path `/neighborhoods/:slug` | Neighborhood. Drops zip and city. |
| `?zip=` | Five-digit ZIP. Drops neighborhood and city. Sets `radius=25` only when radius is absent. |
| `?city=` | City, only when there is no neighborhood and no zip. |
| `?category=` | One of `food`, `grocery`, `convenience`, `retail`, `arts`, `outdoors`. Legacy `browse` and `group` are rewritten to `category`. |
| `?q=` | Search text. Does not clear category. |
| `?view=map` | Map replaces the hero photo. Omitted means the feed layout. |
| `?delivery=1` | Delivery first. Set by the hero switch (`DeliveryFirstToggle` in `Opening.tsx`; on the map in map view). Ranks, never hides. `GET /api/stores?delivery=true` puts delivery-ready stores first before the page is cut, and every listed store carries `fulfillment: { delivery, pickup }` (`available` \| `temporarily_unavailable` \| `not_offered`) from `store-fulfillment.service.ts`. `composeDiscovery` ranks shops and their products the same way. Map pins, counts, stories, and directory listings are unchanged. Stays on through place, category, and search changes. |
| `?lat=&lng=` | Counts as an explicit place, so a remembered ZIP is not written over it. |

Explicit place beats the remembered ZIP and the signed-in address. A neighborhood URL is not a ZIP. A ZIP does not assign a neighborhood (78704 is not Zilker).

`useDiscoveryScroll` scrolls to the top only when the place key changes (neighborhood, zip, city, or the `/neighborhoods` index). Category, `q`, and `view` keep scroll.

## Data feeds

All of these are filtered together by `discoveryResults` before any band sees them. A hero-tag count is `points.length` for that filter, which is the same set the map pins.

| Feed | Loaded by | Shape | Scope |
| --- | --- | --- | --- |
| Stores | `loadStores` → published stores, limit 24 | `StoreWithDistance` → `DiscoveryStore` | Radius around the place, or all when no place |
| Products | `loadProducts`, limit 48 | `DiscoveryItem` | Same radius. Must belong to a store that survived the category filter. |
| Stories | `river.getFeed`, limit 8, real media only | `RiverPost` → `StoryTile` | Same radius. Capped at 4 after dedupe by store. |
| Directory | `GET /api/directory`, limit 40 | `DirectoryListing` | Radius, plus `q` and `group` on the request |
| Curated guide | `useNeighborhoodGuide` → `/api/places/:slug/guide` | `GuideListing` | Neighborhood only. Merged ahead of the directory. Not kept from the previous neighborhood. |
| Neighborhoods | `/api/places/by-zip/:zip` or `/api/places/neighborhoods` | `NeighborhoodCard` | ZIP associations, else published list. Padded to 4. |
| Place | `GET /api/places/:slug` | `DiscoveryPlace` | City, or a published neighborhood. Includes `nearby`, images, postal codes, tags. |
| Account | `useSignedInHome` | orders, addresses, saved stores, saved items | Signed-in only |
| Recent / local saves | `useRecentViews`, `useSavedCollection` | client storage | This browser |

`composeDiscovery` (`tiles.ts`) turns stores, products, and stories into tiles:

- `arts` and `outdoors` exclude every merchant store, product, and story (`inVertical` is false).
- A product matches its own text. A story matches its text and must belong to a category store. A store stays if its text matches or it has a matching product or story.
- Product tiles are capped at 16. The interleaved `tiles` array is capped at 18.
- Names matching `TEST_ARTIFACT_STORE` are dropped when any real store remains.
- Photos are the record's own image, else an editorial image from `editorialMedia.ts` with a credit. Do not invent a photo, rating, hours, or description.

Directory listings are not stores. They are not orderable. They never open `DetailPanel` and never show a cart.

## Containers

Columns: what it draws, the data it accepts, what you can change without a new component, what is fixed in code.

| Container | Draws | Accepts | Flexible | Baked in |
| --- | --- | --- | --- | --- |
| `LocationHero` (`Opening.tsx`) | `.discover-hero`. Photo, title, lede, tags, or the map. | `identity`, `focus`, `story`, `nearest`, `points`, `tags`, `kind` | Copy via `heroIdentity`. Tags via `heroTags.ts`. Map on/off via `view`. | Photo choice in `chooseFeature`: neighborhood cover, else first neighborhood with a photo, else a story image, else the nearest store image. Map mode hides the photo. Category and search do not rewrite the title or lede. |
| `PlaceCard` | `.place-card` thumb. Variants `neighborhood`, `business`, `attraction`, `feature`. | `PlaceCardData` | `placeCardFromNeighborhood`, `placeCardFromStore`, `placeCardFromListing`. Pass `variant` or leave `auto`. | Neighborhood cards have no eyebrow. Other eyebrows are clipped to 2 words. No photo uses the quiet or guide style. Link goes to the neighborhood, the storefront, or `/directory/:slug`. |
| Neighborhood band | `.neighborhood-showcase-row` of neighborhood `PlaceCard`s | `NeighborhoodCard[]` | Count is sliced in `DiscoveryPage` (4, or all on `/neighborhoods`). Copy from `neighborhoodBandCopy`. | On a neighborhood, the pool is `activePlace.nearby`, not the ZIP list. Four hard-coded Austin cards are used only when the API returns none. |
| `MemberShops` | `.featured-lead-card` plus supporting `PlaceCard`s. Returns `null` if empty. | `StoreTile`-like stores, featured `DirectoryListing`s | Lead is the first card with a photo. | Cap 4. Curated listings fill only the leftover slots and only when `featured`. Duplicate names are dropped. |
| `ForYouSurface` | `.shelf-list` of up to 6 small cards. Returns `null` if empty. | Orders, saves, recents, and the current tiles | Reasons are `Saved` and `Recent`. | Not shown until this browser or this account has a save, order, or recent view. Opens `DetailPanel` only when the entry still has a `DiscoveryTile`. |
| `MarketFeed` | Mixed rows inside `.discovery-mixed-grid` | `InfiniteFeedEntry` from `buildInfiniteFeed` | `listKey` resets pagination. `note` is the only extra copy. `excludeIds` hides stores already featured. | Row pattern is fixed: 4 product cards, then 2 store cards, then 1 story, then 3 directory `PlaceCard`s. Page size 16. Feed cap 60. Interleave before that is 2 products, 1 store, 1 directory business, 1 story, 1 attraction. |
| `ProductFeedCard` | `.feed-product-card` | `ProductTile` | Photo or typographic. | Opens `DetailPanel`. Save heart. Not a link. |
| `StoreFeedCard` | `.feed-business-card` | `StoreTile` | Photo or monogram. | Eyebrow is `typeLabel` plus distance. "Order" opens the panel. Merchant only. |
| `StoryFeedCard` | `.feed-story-card` | `StoryTile` | Photo or typographic. | Full-width row. "Read" opens the panel. |
| Directory cell | `.feed-place-cell` > `PlaceCard` | `DirectoryListing` | `variant` is `attraction` for parks, libraries, attractions, entertainment; otherwise `business`. | No Call, Directions, or Website on the card. Those stay on `ListingProfile`. |
| `CategorySection` | `.circle-cat` buttons | None. Labels come from `STORE_TYPE_CONFIG` plus Arts and Outdoors. | Add a category in both `STORE_TYPE_CONFIG` and the `CATEGORIES` set in `discoveryContext.ts`, then teach `inVertical` and `matchesDirectoryBrowse`. | Not data. `MarketFeed` can also render circles; the page passes `showCategories={false}` so they appear once. |
| `DiscoveryToolbar` | Breadcrumb plus the same category buttons and Map | `DiscoveryContext` | Crumbs are derived. Do not add a second search field. | Height stays constant. The query is a dismissible crumb. |
| `NeighborhoodMap` | Pins for `ResultPoint` | `discoveryMapPoints` | Center and radius come from the place. | Pin ids `directory:` navigate to the listing. Other ids open the store panel. A pin is a store or a listing that passed the same browse and query as the feed, deduped by name. |
| `DetailPanel` | Side panel | `DiscoveryTile` plus related products | Related products are other product tiles from the same store. | Directory listings never open it. |

## Key types

| Type | File | What it is |
| --- | --- | --- |
| `DiscoveryContext`, `DiscoveryPatch` | `discoveryContext.ts` | URL state and the only way to change it |
| `DiscoveryBand`, `PlaceKind`, `DiscoveryEmphasis` | `discoveryMode.ts` | Band ids, place kind, and the unused-for-order emphasis |
| `DiscoveryTile` = `ProductTile` \| `StoreTile` \| `StoryTile` | `tiles.ts` | Merchant feed units. Directory is not a tile. |
| `DiscoveryItem`, `DiscoveryStore` | `tiles.ts` | Product and store fields the composer actually reads |
| `InfiniteFeedEntry` | `infiniteFeed.ts` | `product` \| `store` \| `story` \| `directory` \| `attraction` |
| `DirectoryListing` | `DirectoryList.tsx` | Directory row as the client sees it |
| `GuideListing` | `useNeighborhoodGuide.ts` | Admin-curated listing before it is adapted |
| `PlaceCardData`, `PlaceCardVariant` | `PlaceCard.tsx` | The shared thumb |
| `NeighborhoodCard` | `neighborhoodHero.ts` | `id`, `name`, `slug`, `headline`, `about`, `coverUrl` |
| `HeroTag`, `NeighborhoodTag` | `heroTags.ts` | Editorial tags (not filters) and discovery tags (category + optional `q`) |
| `ResultPoint` | `mapResults.ts` | `{ id, name, latitude, longitude }` |

## Copy and layout constraints

- Eyebrows: 2 words. `PlaceCard` enforces this with `twoWords`. Section kickers are written short: Guide, Featured, Nearby, Browse, Local guide.
- Section titles: one word where it already is (Discover, Shops, Categories, Neighborhoods). "For you" is the exception.
- ZIP hero title stays `Shops near {city}, {state}` (`homepageTitle`). Do not replace it with a result sentence. The count goes to `resultsNote` on Discover: `27 places · Food`.
- Neighborhood title is the place name. Lede is `headline`, else `about`, else one fixed sentence. An unknown neighborhood says it is not in the guide instead of pretending the citywide results belong to it.
- Filters and map do not add `.discover-hero.is-results`. Map adds `.is-map`.

## What a change is allowed to do

| You want to | Do this | Do not |
| --- | --- | --- |
| Reorder sections | Reorder `discoveryBands` | Give search or category its own order |
| Show a new block | New `DiscoveryBand` plus a `sections` entry that returns `null` when empty | Mount a second page or a route element per place |
| Point a thumb at a new record | Add a `placeCardFrom*` mapper to `PlaceCardData` | Invent a card markup per feed |
| Filter | `applyDiscoveryPatch` with `category` and/or `q` | Rewrite the hero or scroll to the top |
| Change place | Patch `zip`, `neighborhood`, or `city` | Infer a neighborhood from a ZIP |
| Add a category | Closed set in `discoveryContext.ts`, both browse matchers, and the circle list | Pass a free-form category through `cleanCategory` (it is dropped) |
| Feature a directory place | Curated guide listing with `featured`, and not a name already used by a store | Put a directory listing in `DetailPanel` or on an order button |
| Keep results while the next place loads | Already `keepPreviousData` on stores, products, stories, and directory. The guide query does not use it. | Clear the page to a spinner between places |

Pagination scope is `listKey` (path + neighborhood + zip + city + category + q). Changing map view does not reset the list. Visit memory (`useDiscoveryVisit`) restores scroll and an open tile when coming back from a store or a listing.
