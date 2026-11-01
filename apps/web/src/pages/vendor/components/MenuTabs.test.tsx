import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { MenuTabs } from './MenuTabs'

function Where() {
  return <output aria-label="location">{useLocation().pathname}</output>
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<><MenuTabs storeId="s1" /><Where /></>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('MenuTabs', () => {
  it('selects the tab from the URL and moves between Items and Bundles', async () => {
    const user = userEvent.setup()
    renderAt('/vendor/s1/menu/bundles')
    expect(screen.getByRole('tab', { name: 'Bundles', selected: true })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Items' }))
    expect(screen.getByLabelText('location')).toHaveTextContent(/^\/vendor\/s1\/menu$/)
    expect(screen.getByRole('tab', { name: 'Items', selected: true })).toBeInTheDocument()
  })
})
