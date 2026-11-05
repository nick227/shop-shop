/** Words and numbers for the delivery-area editor, kept apart from the layout. */
import { ringCrosses, type LatLng } from './zoneGeometry'

export const money = (value: number) => `$${value.toFixed(2)}`

export function amount(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function zoneTerms(fee: number, minimum: number | null, storeMinimum: number | null): string {
  const feeText = fee === 0 ? 'Free delivery' : `${money(fee)} delivery`
  const min = minimum ?? storeMinimum
  return `${feeText} · ${min ? `${money(min)} minimum` : 'no minimum'}`
}

/** One sentence on who gets delivery right now, and whether it needs the vendor's attention. */
export function areaSummary(input: {
  usingZones: boolean
  activeZones: number
  radius: number | null
  fee: number | null
  minimum: number | null
}): { text: string; warns: boolean } {
  const { usingZones, activeZones, radius, fee, minimum } = input
  if (usingZones) {
    if (activeZones === 0) return { text: 'No delivery areas yet. Until you save one, shoppers see pickup only.', warns: true }
    if (activeZones === 1) return { text: 'One area gets delivery. Addresses outside it see pickup only.', warns: false }
    return { text: `${activeZones} areas get delivery. Addresses outside them see pickup only.`, warns: false }
  }
  if (!radius || radius <= 0) return { text: 'Set a distance. Until then shoppers see pickup only.', warns: true }
  const price = fee ? money(fee) : 'free'
  const floor = minimum ? ` on orders of ${money(minimum)} or more` : ''
  return { text: `Shoppers within ${radius} miles get delivery for ${price}${floor}.`, warns: false }
}

export interface Draft {
  readonly id?: string
  readonly name: string
  readonly fee: string
  readonly minimum: string
  readonly ring: LatLng[]
  readonly drawing: boolean
  readonly error?: string
}

/** What stops this area from being saved, in the vendor's terms. */
export function draftProblem(draft: Draft): string | null {
  if (draft.ring.length < 3) return 'Add at least three corners on the map.'
  if (ringCrosses(draft.ring)) return 'The outline crosses itself. Drag a corner so the edges don’t overlap.'
  if (!draft.name.trim()) return 'Name the area, for example “Downtown”.'
  const fee = amount(draft.fee)
  if (fee === null || fee < 0) return 'Enter a delivery fee (0 for free delivery).'
  const minimum = amount(draft.minimum)
  if (draft.minimum !== '' && (minimum === null || minimum < 0)) return 'Enter a minimum, or leave it empty.'
  return null
}

/** Enter inside the editor would submit the store form around it; run the editor's action instead. */
export const onEnter = (action: () => void) => (event: { key: string; preventDefault: () => void }) => {
  if (event.key !== 'Enter') return
  event.preventDefault()
  action()
}
