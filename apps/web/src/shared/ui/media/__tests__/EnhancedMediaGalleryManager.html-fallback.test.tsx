import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { EnhancedMediaGalleryManager } from '../EnhancedMediaGalleryManager'

describe('EnhancedMediaGalleryManager - HTML fallback regression', () => {
  it('shows a clear error when /media returns Vite HTML instead of JSON', async () => {
    const html = '<!doctype html>\n<html>\n <head>\n <script type="module">import RefreshRuntime from "/@react-refresh"</script>'

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => html,
    })

    vi.stubGlobal('fetch', fetchMock)

    render(
      <EnhancedMediaGalleryManager
        itemId="new-item-id"
        storeId="store-id"
        maxFiles={100}
      />
    )

    expect(
      await screen.findByText(/Failed to parse \/api\/media response as JSON/i)
    ).toBeInTheDocument()

    expect(
      screen.getByText(/<!doctype html/i)
    ).toBeInTheDocument()

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/media?storeId=store-id&itemId=new-item-id'),
      expect.any(Object)
    )
  })
})

