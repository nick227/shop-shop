import { Link, useLocation } from 'react-router-dom'
import { STORE_TYPE_GROUPS, STORE_TYPE_LABEL } from '@features/search/config/storeTypes'
import { readDiscoveryContext } from '@features/home/discovery/discoveryContext'
import { Breadcrumbs } from './Breadcrumbs'
import { discoveryReturn } from './context'
import './navigation.css'

export type BusinessPlace = {
  name: string
  addressCity?: string | null
  addressZip?: string | null
  storeType?: string | null
  category?: string
  categoryLabel?: string
  city?: { name: string; slug: string } | null
  neighborhood?: { name: string; slug: string } | null
  primaryCategory?: string
  categories?: readonly { slug: string; label: string }[]
}

export function BusinessNavigation({ business }: { business: BusinessPlace }) {
  const { search } = useLocation()
  const back = discoveryReturn(search)
  const origin = back ? new URL(back, 'https://shop.invalid') : undefined
  const arrival = origin ? readDiscoveryContext(origin.pathname, origin.search).category : ''
  const type = (business.category || business.storeType || '').toUpperCase()
  const broad = Object.entries(STORE_TYPE_GROUPS).find(([key, types]) => key === type || types.includes(type))?.[0].toLowerCase()
    ?? (['ATTRACTION', 'ENTERTAINMENT', 'ARTS'].includes(type) ? 'arts' : ['PARK', 'LIBRARY', 'OUTDOORS'].includes(type) ? 'outdoors' : undefined)
  const categories = business.categories?.length ? business.categories : broad ? [{ slug: broad, label: STORE_TYPE_LABEL[broad.toUpperCase()] || ({ arts: 'Arts', outdoors: 'Outdoors' } as Record<string, string>)[broad] || business.categoryLabel || broad }] : []
  const category = categories.find((entry) => entry.slug === arrival) ?? categories.find((entry) => entry.slug === (business.primaryCategory || broad)) ?? categories[0]
  const cityName = business.city?.name || [business.addressCity, business.addressZip].filter(Boolean).join(' ')
  const place = new URLSearchParams()
  if (business.city?.slug) place.set('city', business.city.slug)
  else if (business.addressZip) place.set('zip', business.addressZip)
  else if (business.addressCity) place.set('city', business.addressCity)
  const cityHref = `/explore?${place}`
  const neighborhood = business.neighborhood
  const base = neighborhood ? `/neighborhoods/${encodeURIComponent(neighborhood.slug)}` : '/explore'
  const categoryParams = neighborhood ? new URLSearchParams() : new URLSearchParams(place)
  if (category) categoryParams.set('category', category.slug)
  return (
    <div className="business-navigation">
      {back ? <Link className="business-results" to={back}>← Back to results</Link> : null}
      <Breadcrumbs
        label="Business breadcrumb"
        crumbs={[
          { key: 'city', label: cityName || 'Explore', to: cityName ? cityHref : '/explore' },
          ...(neighborhood ? [{ key: 'neighborhood', label: neighborhood.name, to: base }] : []),
          ...(category ? [{ key: 'category', label: category.label, to: `${base}?${categoryParams}` }] : []),
          { key: 'business', label: business.name },
        ]}
      />
    </div>
  )
}
