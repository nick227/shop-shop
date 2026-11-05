export type ListingCandidate = {
  readonly source: 'osm' | 'admin'
  readonly sourceId: string
  readonly name: string
  readonly category: string
  readonly categoryLabel: string
  readonly street: string | null
  readonly city: string | null
  readonly state: string | null
  readonly zip: string | null
  readonly latitude: number | null
  readonly longitude: number | null
  readonly phone: string | null
  readonly website: string | null
  readonly description: string | null
  readonly evidence: readonly string[]
}

export type KnownListing = {
  readonly sourceId: string
  readonly name: string
  readonly latitude: number | null
  readonly longitude: number | null
}

export type KnownStore = {
  readonly id: string
  readonly name: string
  readonly latitude: number | null
  readonly longitude: number | null
}

export type ImportDecision = {
  readonly status: 'READY' | 'REVIEW' | 'EXISTING' | 'NOT_FOUND'
  readonly candidates: readonly ListingCandidate[]
  readonly selectedSourceId: string | null
  readonly storeId: string | null
}

export type ListingSource = {
  search(names: readonly string[]): Promise<ListingCandidate[]>
}
