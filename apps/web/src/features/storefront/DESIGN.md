# Storefront design critique

Living notes for sizing, hierarchy, space, and flow. Update when the page order changes.

## Feature inventory

| Feature | Role | Shopper job |
| --- | --- | --- |
| Nav / breadcrumb | Orientation | Leave or climb back into discovery |
| Hero (photo \| map) | Place | See the place and where it is |
| Identity | Who | Name, address, reach actions |
| Ordering strip | Can I buy? | Open / taking orders / pickup / delivery |
| Featured | Appetite | Jump into popular or pinned items |
| Menu search + section links | Find | Filter or jump without scrolling blind |
| Category tiles | Big catalogs only | Department directory |
| Menu | Buy | Browse and add |
| Bundles | Upsell | Order a set |
| Announcements | Merchant voice | Promo / notice |
| About | Trust | Story, hours, contact, social |
| Photos | Atmosphere | Extra store photos (not the hero) |
| Updates | Live | Posts from the shop |
| Item sheet | Decide | Detail + quantity |
| Cart bar | Commit | Checkout this store |

Directory profiles reuse the same shell with commerce off (no ordering, menu, cart).

## Critique (current problems)

**Hierarchy.** Address competed with tagline and lived again in About and on the map caption. Featured sat below About, so the buy path waited on a story block. Search stuck above every section, so featured never led.

**Sizing.** `space-y-8` everywhere made a short shop feel sparse. Featured cards used the same large tile scale as the menu. Gallery thumbs were right; identity type was loud relative to the next action.

**Space.** Dual address + map caption + About location burned vertical room. Directory pages with no cover left a full-width map alone, then a thin identity, then a left-stacked About.

**Flow.** Old path: hero → identity → ordering → search → about → featured → menu. Shoppers who came to order hit About before products. Target path puts commerce first.

## Target flow

```
nav
hero                 photo 3 / map 1, identity floated on the cover (home-hero style)
ordering             taking orders / open / fulfillment
featured             compact appetite row
search / sections    sticky wayfinding
menu                 tight rows / cards
────────             everything else
categories → bundles → announcements → about → photos → updates
cart
```

Rules: address lives on the hero cover. About keeps story and hours, not a second location card. Empty blocks stay unmounted. Search still hides everything except the menu.

## Vendor editor

Same `Storefront` renderer in `mode="preview"`. Outline fixed rows: Hero & brand, Hero photos, Ordering details — then `STOREFRONT_SECTIONS`. Preview shows the map beside the cover when the store has coordinates. Photos panel: first upload is the hero cover.
