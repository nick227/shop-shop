import { render, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { readVisit, saveVisit } from './context'
import { useDiscoveryVisit } from './useDiscoveryVisit'

beforeEach(() => { sessionStorage.clear() })
afterEach(() => { cleanup(); vi.restoreAllMocks() })

it('restores scroll and result focus while retaining loaded feed depth', async () => {
  saveVisit('/explore?q=coffee', { y: 600, count: 48, href: '/directory/cafe', selected: 'store:one' })
  const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 3000 })
  function Visit() {
    useDiscoveryVisit('store:one')
    return <a href="/directory/cafe" data-discovery-destination="/directory/cafe">Café</a>
  }
  const view = render(<MemoryRouter initialEntries={['/explore?q=coffee']}><Visit /></MemoryRouter>)
  await waitFor(() => expect(scroll).toHaveBeenCalledWith(0, 600))
  expect(view.getByText('Café')).toHaveFocus()
  expect(readVisit('/explore?q=coffee')).toMatchObject({ count: 48, selected: 'store:one' })
})

it('keeps visit data scoped to the complete discovery URL', () => {
  saveVisit('/explore?radius=10&view=map', { y: 200, count: 32 })
  saveVisit('/explore?radius=25&view=feed', { y: 900 })
  expect(readVisit('/explore?radius=10&view=map')).toMatchObject({ y: 200, count: 32 })
  expect(readVisit('/explore?radius=25&view=feed')).toMatchObject({ y: 900 })
})
