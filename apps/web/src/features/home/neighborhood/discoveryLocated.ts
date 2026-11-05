/** Nearby shops load only after a ZIP resolves to coordinates. */
export function discoveryLocated(hasLocation: boolean): boolean {
  return hasLocation
}

export function shopsNearLabel(city: string, state: string): string {
  return `Shops near ${city}, ${state}`
}

export function radiusLabel(miles: number, zip: string): string {
  return `Within ${miles} miles of ${zip}`
}
