export interface EditorialPhoto {
  readonly url: string
  readonly attribution: string
}

const CATALOG: Readonly<Record<string, EditorialPhoto>> = {
  zilker: { url: '/editorial/zilker.jpg', attribution: 'Photo: Downtown Austin · Public domain' },
  'south-congress': { url: '/editorial/south-congress.jpg', attribution: 'Photo: Justin Jensen · CC BY 2.0' },
  'south-lamar': { url: '/editorial/south-lamar.jpg', attribution: 'Photo: Larry D. Moore · CC BY 4.0' },
  'east-austin': { url: '/editorial/east-austin.jpg', attribution: 'Photo: Larry D. Moore · CC BY 4.0' },
  'tacos-pastor': { url: '/editorial/tacos-pastor.jpg', attribution: 'Photo: Larry Miller · CC BY-SA 2.0' },
  'tacos-migas': { url: '/editorial/tacos-migas.jpg', attribution: 'Photo: Ruth Hartnup · CC BY 2.0' },
  brisket: { url: '/editorial/brisket.jpg', attribution: 'Photo: Johnsparks75 · CC BY-SA 4.0' },
  'coffee-latte': { url: '/editorial/coffee-latte.jpg', attribution: 'Photo: avlxyz · CC BY-SA 2.0' },
  'bakery-pastry': { url: '/editorial/bakery-pastry.jpg', attribution: 'Photo: RhinoMind · CC BY-SA 3.0' },
  'farmers-produce': { url: '/editorial/farmers-produce.jpg', attribution: 'Photo: PattayaPatrol · CC BY-SA 4.0' },
  'fresh-peaches': { url: '/editorial/fresh-peaches.jpg', attribution: 'Photo: Harrison’s Nurseries · Public domain' },
  'wood-pizza': { url: '/editorial/wood-pizza.jpg', attribution: 'Photo: Mario56 · CC BY-SA 3.0' },
}

const GROUPS: readonly { readonly test: RegExp; readonly keys: readonly string[] }[] = [
  { test: /peach/, keys: ['fresh-peaches'] },
  { test: /taco|migas|quesadilla|burrito|carnitas|enchilada/, keys: ['tacos-pastor', 'tacos-migas'] },
  { test: /brisket|bbq|barbecue|smoked/, keys: ['brisket'] },
  { test: /latte|coffee|espresso|roast|cafe|cappuccino/, keys: ['coffee-latte'] },
  { test: /pastry|bakery|danish|doughnut|donut|dough|cookie|cake|bread/, keys: ['bakery-pastry'] },
  { test: /pizza/, keys: ['wood-pizza'] },
  { test: /produce|fruit|grocery|vegetable|market|salad|peach/, keys: ['farmers-produce', 'fresh-peaches'] },
]

function pick(keys: readonly string[], seed: string): EditorialPhoto | undefined {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  const key = keys[hash % keys.length]
  return key ? CATALOG[key] : undefined
}

const DEFAULT_KEYS = ['farmers-produce', 'wood-pizza', 'coffee-latte', 'brisket', 'tacos-pastor', 'bakery-pastry'] as const

/** Licensed editorial photo for a name or description. Own merchant media should win before this. */
export function editorialFor(text: string, seed: string): EditorialPhoto {
  const haystack = text.toLowerCase()
  const group = GROUPS.find((entry) => entry.test.test(haystack))
  return pick(group?.keys ?? DEFAULT_KEYS, seed)!
}

export function creditForUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  return Object.values(CATALOG).find((photo) => url.endsWith(photo.url))?.attribution
}
