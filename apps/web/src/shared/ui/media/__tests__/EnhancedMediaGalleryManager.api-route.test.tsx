import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { EnhancedMediaGalleryManager } from '../EnhancedMediaGalleryManager'

describe('EnhancedMediaGalleryManager - API route usage', () => {
  it('uses the backend API media route, not the Vite frontend fallback route', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ data: [] }),
    })

    vi.stubGlobal('fetch', fetchMock)

    render(
      <EnhancedMediaGalleryManager
        itemId="item-123"
        storeId="store-123"
        maxFiles={100}
      />
    )

    await screen.findByText(/No media uploaded yet/i)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/media?storeId=store-123&itemId=item-123',
      expect.objectContaining({ credentials: 'include' })
    )
  })
})

