import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const authPostMock = vi.fn()

vi.mock('@shared/lib/auth/authFetch', () => ({
  authPost: (...args: unknown[]) => authPostMock(...args),
}))

let lastOnDrop: ((files: File[]) => unknown) | undefined

vi.mock('react-dropzone', () => ({
  useDropzone: (input: { onDrop: (files: File[]) => unknown }) => {
    lastOnDrop = input.onDrop
    return {
      getRootProps: () => ({}),
      getInputProps: () => ({}),
    }
  },
}))

import { EnhancedMediaUploader } from '../EnhancedMediaUploader'

describe('EnhancedMediaUploader - API route usage', () => {
  it('uploads to /api/media/upload via authPost', async () => {
    const createObjectUrl = vi.fn(() => 'blob:preview')
    const revokeObjectUrl = vi.fn()
    vi.stubGlobal('URL', { createObjectURL: createObjectUrl, revokeObjectURL: revokeObjectUrl } as any)

    authPostMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'm1' }),
      clone: () => ({ text: async () => '' }),
    })

    render(<EnhancedMediaUploader storeId="s1" itemId="i1" />)

    const file = new File(['x'], 'photo.png', { type: 'image/png' })
    await lastOnDrop?.([file])

    expect(authPostMock).toHaveBeenCalledWith('/api/media/upload', expect.any(FormData))
  })
})

