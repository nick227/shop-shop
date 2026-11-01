import { describe, expect, it, vi } from 'vitest'

const { createStore, updateStore } = vi.hoisted(() => ({
  createStore: vi.fn(),
  updateStore: vi.fn(),
}))
vi.mock('../client', () => ({
  apiClient: { stores: () => ({ createStore, updateStore }) },
  ApiContractError: class extends Error {},
}))

import { stores } from '../apiWrapper'
import { handleApiError } from './index'

function sdkError(body: string, status = 409) {
  return Object.assign(new Error('Response returned an error code'), {
    response: new Response(body, { status }),
  })
}

describe('store save errors', () => {
  it.each(['create', 'update'] as const)('preserves server details for wrapped %s requests', async (operation) => {
    const body = { message: 'This store slug is already in use', requestId: 'save-123' }
    const error = sdkError(JSON.stringify(body))
    createStore.mockRejectedValueOnce(error)
    updateStore.mockRejectedValueOnce(error)
    const request = operation === 'create'
      ? stores.create({} as never)
      : stores.update('store-id', {} as never)
    const result = await request.catch(handleApiError)
    expect(result).toMatchObject({
      message: body.message,
      status: 409,
      code: 'CONFLICT',
      details: body,
    })
    expect(error.response.bodyUsed).toBe(false)
    vi.resetAllMocks()
  })

  it('preserves the server message for direct SDK update errors', async () => {
    const error = sdkError(JSON.stringify({ message: 'Store is not ready to publish' }), 400)
    expect(await handleApiError(error)).toMatchObject({
      message: 'Store is not ready to publish', status: 400, code: 'BAD_REQUEST',
    })
  })

  it('falls back to a readable status message for non-JSON responses', async () => {
    expect(await handleApiError(sdkError('<html>Unavailable</html>', 503))).toMatchObject({
      message: 'Service unavailable', status: 503,
    })
  })
})
