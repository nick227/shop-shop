import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { BusinessNavigation } from './BusinessNavigation'
import { DiscoveryLink } from './DiscoveryLink'
import { discoveryReturn, withDiscoveryOrigin } from './context'
import { applyDiscoveryPatch } from '@features/home/discovery/discoveryContext'

afterEach(cleanup)
const source = '/neighborhoods/austin-tx-south-congress?q=coffee&category=food&radius=10&sort=distance&view=map&price=2&style=casual&lat=30&lng=-97#results'
const business = { name: 'Local Café', addressCity: 'Austin', addressZip: '78704', neighborhood: { name: 'South Congress', slug: 'austin-tx-south-congress' }, categories: [{ slug: 'retail', label: 'Retail' }, { slug: 'food', label: 'Food' }] }

describe('business discovery navigation', () => {
  it('carries the complete URL through intermediate items and directory redirects', () => {
    const url = new URL(source, 'https://shop.invalid')
    const item = withDiscoveryOrigin('/items/one?item=two', url.pathname, url.search, url.hash)
    const directory = withDiscoveryOrigin('/directory/cafe', '/items/one', new URL(item, url).search)
    const merchant = withDiscoveryOrigin('/kitchen/cafe', '/directory/cafe', new URL(directory, url).search)
    expect(discoveryReturn(new URL(merchant, url).search)).toBe(source)
    expect(new URL(item, url).searchParams.get('item')).toBe('two')
  })

  it('rejects external, malformed and non-discovery return destinations', () => {
    for (const value of ['https://evil.test/explore', '//evil.test/explore', '/\\evil.test/explore', '/admin', '/kitchen/test', '/explore\n']) {
      expect(discoveryReturn(`from=${encodeURIComponent(value)}`)).toBeUndefined()
    }
  })

  it('provides direct-visit breadcrumbs without inventing history or facet levels', () => {
    render(<MemoryRouter><BusinessNavigation business={business} /></MemoryRouter>)
    expect(screen.queryByText(/Back to results/)).toBeNull()
    expect(screen.getByText('South Congress')).toHaveAttribute('href', '/neighborhoods/austin-tx-south-congress')
    expect(screen.getByText('Retail')).toBeInTheDocument()
    expect(screen.getByText('Local Café')).toHaveAttribute('aria-current', 'page')
  })

  it('reconstructs return context after reload or a new tab from the href alone', () => {
    const href = `/kitchen/cafe?from=${encodeURIComponent(source)}`
    render(<MemoryRouter initialEntries={[href]}><BusinessNavigation business={business} /></MemoryRouter>)
    expect(screen.getByText(/Back to results/)).toHaveAttribute('href', source)
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.queryByText('Retail')).toBeNull()
    expect(screen.queryByText('casual')).toBeNull()
  })

  it('supports navigation, return, and browser history with real contextual hrefs', () => {
    function History() { const navigate = useNavigate(); return <><button onClick={() => navigate(-1)}>Previous</button><button onClick={() => navigate(1)}>Next</button></> }
    render(<MemoryRouter initialEntries={[source]}><History /><Routes>
      <Route path="/neighborhoods/:slug" element={<DiscoveryLink to="/kitchen/cafe">Open café</DiscoveryLink>} />
      <Route path="/kitchen/:slug" element={<BusinessNavigation business={business} />} />
    </Routes></MemoryRouter>)
    expect(screen.getByText('Open café').getAttribute('href')).toContain('from=')
    fireEvent.click(screen.getByText('Open café'))
    expect(screen.getByText(/Back to results/)).toHaveAttribute('href', source)
    fireEvent.click(screen.getByText('Previous'))
    expect(screen.getByText('Open café')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Next'))
    fireEvent.click(screen.getByText(/Back to results/))
    expect(screen.getByText('Open café')).toBeInTheDocument()
  })

  it('retains explicit radius, sort, map state and independent facets on category changes', () => {
    const next = applyDiscoveryPatch('/explore', 'zip=78704&radius=10&sort=distance&view=map&price=2&style=casual&q=coffee', { category: 'food' })
    const params = new URLSearchParams(next.search)
    expect(Object.fromEntries(params)).toMatchObject({ radius: '10', sort: 'distance', view: 'map', price: '2', style: 'casual', q: 'coffee', category: 'food' })
  })
})
