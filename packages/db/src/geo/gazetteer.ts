/** First-party ZIP and place rows. This is not the geocoding request cache. */

export type GazetteerCity = {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly state: string
  readonly latitude: number
  readonly longitude: number
}

export type GazetteerNeighborhood = {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly parentId: string
  readonly state: string
  readonly latitude: number
  readonly longitude: number
  readonly postalCodes: readonly string[]
  readonly boundaryJson?: unknown
}

export type GazetteerZip = {
  readonly code: string
  readonly cityPlaceId: string
  readonly latitude: number
  readonly longitude: number
}

export const AUSTIN_PLACE_ID = '11111111-1111-4111-8111-000000000001'
export const WEST_CAMPUS_PLACE_ID = '11111111-1111-4111-8111-000000000002'
export const NEW_YORK_PLACE_ID = '11111111-1111-4111-8111-000000000003'
export const LOS_ANGELES_PLACE_ID = '11111111-1111-4111-8111-000000000004'

export const GAZETTEER_CITIES: readonly GazetteerCity[] = [
  { id: AUSTIN_PLACE_ID, slug: 'austin-tx', name: 'Austin', state: 'TX', latitude: 30.2672, longitude: -97.7431 },
  { id: NEW_YORK_PLACE_ID, slug: 'new-york-ny', name: 'New York', state: 'NY', latitude: 40.7128, longitude: -74.006 },
  { id: LOS_ANGELES_PLACE_ID, slug: 'los-angeles-ca', name: 'Los Angeles', state: 'CA', latitude: 34.0522, longitude: -118.2437 },
]

const westCampusBoundary = {
  type: 'Polygon',
  coordinates: [[
    [-97.752, 30.284],
    [-97.73, 30.284],
    [-97.73, 30.3],
    [-97.752, 30.3],
    [-97.752, 30.284],
  ]],
}

export const GAZETTEER_NEIGHBORHOODS: readonly GazetteerNeighborhood[] = [
  {
    id: WEST_CAMPUS_PLACE_ID,
    slug: 'austin-tx-west-campus',
    name: 'West Campus',
    parentId: AUSTIN_PLACE_ID,
    state: 'TX',
    latitude: 30.2925,
    longitude: -97.7414,
    postalCodes: ['78705'],
    boundaryJson: westCampusBoundary,
  },
]

export const GAZETTEER_ZIPS: readonly GazetteerZip[] = [
  { code: '78701', cityPlaceId: AUSTIN_PLACE_ID, latitude: 30.2711, longitude: -97.7437 },
  { code: '78704', cityPlaceId: AUSTIN_PLACE_ID, latitude: 30.242, longitude: -97.768 },
  { code: '78705', cityPlaceId: AUSTIN_PLACE_ID, latitude: 30.2925, longitude: -97.7414 },
  { code: '78751', cityPlaceId: AUSTIN_PLACE_ID, latitude: 30.3107, longitude: -97.724 },
  { code: '78752', cityPlaceId: AUSTIN_PLACE_ID, latitude: 30.331, longitude: -97.705 },
  { code: '78753', cityPlaceId: AUSTIN_PLACE_ID, latitude: 30.386, longitude: -97.673 },
  { code: '78756', cityPlaceId: AUSTIN_PLACE_ID, latitude: 30.3225, longitude: -97.7405 },
  { code: '78757', cityPlaceId: AUSTIN_PLACE_ID, latitude: 30.3515, longitude: -97.7335 },
  { code: '78758', cityPlaceId: AUSTIN_PLACE_ID, latitude: 30.387, longitude: -97.7055 },
  { code: '78759', cityPlaceId: AUSTIN_PLACE_ID, latitude: 30.4015, longitude: -97.76 },
  { code: '10001', cityPlaceId: NEW_YORK_PLACE_ID, latitude: 40.7506, longitude: -73.9971 },
  { code: '90001', cityPlaceId: LOS_ANGELES_PLACE_ID, latitude: 33.9731, longitude: -118.2479 },
]
