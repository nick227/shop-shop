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
  burrito: { url: '/editorial/burrito.jpg', attribution: 'Photo: local editorial · CC licensed' },
  guacamole: { url: '/editorial/guacamole.jpg', attribution: 'Photo: local editorial · CC licensed' },
  brisket: { url: '/editorial/brisket.jpg', attribution: 'Photo: Johnsparks75 · CC BY-SA 4.0' },
  'coffee-latte': { url: '/editorial/coffee-latte.jpg', attribution: 'Photo: avlxyz · CC BY-SA 2.0' },
  'iced-coffee': { url: '/editorial/iced-coffee.jpg', attribution: 'Photo: local editorial · CC licensed' },
  'bakery-pastry': { url: '/editorial/bakery-pastry.jpg', attribution: 'Photo: RhinoMind · CC BY-SA 3.0' },
  'fresh-bread': { url: '/editorial/fresh-bread.jpg', attribution: 'Photo: local editorial · CC licensed' },
  'farmers-produce': { url: '/editorial/farmers-produce.jpg', attribution: 'Photo: PattayaPatrol · CC BY-SA 4.0' },
  'fresh-peaches': { url: '/editorial/fresh-peaches.jpg', attribution: 'Photo: Harrison’s Nurseries · Public domain' },
  'wood-pizza': { url: '/editorial/wood-pizza.jpg', attribution: 'Photo: Mario56 · CC BY-SA 3.0' },
  'ramen-bowl': { url: '/editorial/ramen-bowl.jpg', attribution: 'Photo: local editorial · CC licensed' },
}

const GROUPS: readonly { readonly test: RegExp; readonly keys: readonly string[] }[] = [
  { test: /peach/, keys: ['fresh-peaches'] },
  { test: /taco|migas|quesadilla|burrito|carnitas|enchilada|guacamole/, keys: ['tacos-pastor', 'tacos-migas', 'burrito', 'guacamole'] },
  { test: /brisket|bbq|barbecue|smoked|burger/, keys: ['brisket'] },
  { test: /latte|coffee|espresso|roast|cafe|cappuccino/, keys: ['coffee-latte', 'iced-coffee'] },
  { test: /pastry|bakery|danish|doughnut|donut|dough|cookie|cake|bread/, keys: ['bakery-pastry', 'fresh-bread'] },
  { test: /pizza/, keys: ['wood-pizza'] },
  { test: /ramen|sushi|noodle|thai|pho/, keys: ['ramen-bowl'] },
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
