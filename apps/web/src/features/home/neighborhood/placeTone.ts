export type PlaceTone = 'food' | 'drink' | 'shop' | 'arts' | 'outdoors' | 'place'

export function placeTone(category = '', label = ''): PlaceTone {
  const text = `${category} ${label}`.toLowerCase()
  if (/park|library|outdoor/.test(text)) return 'outdoors'
  if (/attraction|entertainment|art|theatre|cinema|museum|gallery/.test(text)) return 'arts'
  if (/coffee|bar|pub|bakery|drink/.test(text)) return 'drink'
  if (/grocery|convenience|retail|shop/.test(text)) return 'shop'
  if (/restaurant|food|ice cream/.test(text)) return 'food'
  return 'place'
}
