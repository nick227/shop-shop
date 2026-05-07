/**
 * Regression Tests for authFetch
 * 
 * Tests that authFetch properly attaches Authorization headers
 * and that media/team API calls use it correctly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authFetch, authGet, authPost, apiPath } from './authFetch'
import { useAuthStore } from '@stores/authStore'

// Mock useAuthStore as a hook using vi.hoisted
const mockUseAuthStore = vi.hoisted(() => ({
  getState: vi.fn()
}))
vi.mock('@stores/authStore', () => ({ useAuthStore: mockUseAuthStore }))

describe('authFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authorization Header Attachment', () => {
    it('should attach Authorization header when token is present', async () => {
      const mockToken = 'test-token-123'
      vi.mocked(useAuthStore).getState.mockReturnValue({
        token: mockToken,
        user: undefined,
        isAuthenticated: true,
        clearAuth: vi.fn(),
        setAuth: vi.fn(),
        updateUser: vi.fn()
      })

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true })
      })
      global.fetch = mockFetch

      await authGet('/api/test')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String), // full URL
        expect.objectContaining({
          headers: expect.any(Headers)
        })
      )

      const callArgs = mockFetch.mock.calls[0]
      const headers = callArgs[1].headers as Headers
      expect(headers.get('Authorization')).toBe(`Bearer ${mockToken}`)
      expect(headers.get('Accept')).toBe('application/json')
    })

    it('should not attach Authorization header when token is absent', async () => {
      vi.mocked(useAuthStore).getState.mockReturnValue({
        token: undefined,
        user: undefined,
        isAuthenticated: false,
        clearAuth: vi.fn(),
        setAuth: vi.fn(),
        updateUser: vi.fn()
      })

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true })
      })
      global.fetch = mockFetch

      await authGet('/api/test')

      const callArgs = mockFetch.mock.calls[0]
      const headers = callArgs[1].headers as Headers
      expect(headers.get('Authorization')).toBeNull()
    })
  })

  describe('API Path Helper', () => {
    it('should build correct API paths', () => {
      // Mock import.meta.env
      vi.stubEnv('VITE_API_URL', 'http://localhost:3005')
      
      expect(apiPath('/api/test')).toBe('http://localhost:3005/api/test')
      expect(apiPath('api/test')).toBe('http://localhost:3005/api/test')
    })

    it('should resolve media upload path correctly', () => {
      vi.stubEnv('VITE_API_URL', 'http://localhost:3005')
      
      expect(apiPath('/api/media/upload')).toBe('http://localhost:3005/api/media/upload')
      expect(apiPath('api/media/upload')).toBe('http://localhost:3005/api/media/upload')
    })
  })

  describe('401 Response Handling', () => {
    it('should clear auth state and dispatch logout on 401', async () => {
      const mockClearAuth = vi.fn()
      const mockDispatchEvent = vi.fn()
      global.dispatchEvent = mockDispatchEvent

      vi.mocked(useAuthStore).getState.mockReturnValue({
        token: 'test-token',
        user: { id: '1', email: 'test@example.com' },
        isAuthenticated: true,
        clearAuth: mockClearAuth,
        setAuth: vi.fn(),
        updateUser: vi.fn()
      })

      const mockFetch = vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        json: vi.fn().mockResolvedValue({ error: 'Unauthorized' })
      })
      global.fetch = mockFetch

      await authGet('/api/test')

      expect(mockClearAuth).toHaveBeenCalled()
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth:logout'
        })
      )
    })
  })

  describe('Content-Type Handling', () => {
    it('should set Content-Type for JSON requests', async () => {
      vi.mocked(useAuthStore).getState.mockReturnValue({
        token: 'test-token',
        user: undefined,
        isAuthenticated: true,
        clearAuth: vi.fn(),
        setAuth: vi.fn(),
        updateUser: vi.fn()
      })

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true })
      })
      global.fetch = mockFetch

      await authPost('/api/test', { data: 'test' })

      const callArgs = mockFetch.mock.calls[0]
      const headers = callArgs[1].headers as Headers
      expect(headers.get('Content-Type')).toBe('application/json')
    })

    it('should not override Content-Type for FormData', async () => {
      vi.mocked(useAuthStore).getState.mockReturnValue({
        token: 'test-token',
        user: undefined,
        isAuthenticated: true,
        clearAuth: vi.fn(),
        setAuth: vi.fn(),
        updateUser: vi.fn()
      })

      const formData = new FormData()
      formData.append('file', new Blob())

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true })
      })
      global.fetch = mockFetch

      await authPost('/api/upload', formData)

      const callArgs = mockFetch.mock.calls[0]
      const headers = callArgs[1].headers as Headers
      expect(headers.get('Content-Type')).toBeNull() // FormData should set its own Content-Type
    })
  })
})

describe('API Integration Tests', () => {
  describe('Team API Integration', () => {
    it('should use authFetch for team API calls', async () => {
      const { fetchTeamMeStores } = await import('../../hooks/hooks/vendor/vendorTeamApi')
      
      const mockToken = 'team-test-token'
      vi.mocked(useAuthStore).getState.mockReturnValue({
        token: mockToken,
        user: undefined,
        isAuthenticated: true,
        clearAuth: vi.fn(),
        setAuth: vi.fn(),
        updateUser: vi.fn()
      })

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ stores: [] })
      })
      global.fetch = mockFetch

      await fetchTeamMeStores()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/team/me/stores'),
        expect.objectContaining({
          headers: expect.any(Headers)
        })
      )

      const callArgs = mockFetch.mock.calls[0]
      const headers = callArgs[1].headers as Headers
      expect(headers.get('Authorization')).toBe(`Bearer ${mockToken}`)
    })
  })

  describe('Media API Integration', () => {
    it('should use authFetch for media upload calls', async () => {
      const { authPost } = await import('./authFetch')

      const mockToken = 'media-test-token'
      vi.mocked(useAuthStore).getState.mockReturnValue({
        token: mockToken,
        user: undefined,
        isAuthenticated: true,
        clearAuth: vi.fn(),
        setAuth: vi.fn(),
        updateUser: vi.fn()
      })

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ id: '1', url: 'test.jpg' }),
      })
      global.fetch = mockFetch

      const formData = new FormData()
      formData.append('file', new Blob(['test']), 'test.jpg')
      formData.append('storeId', 'test-store')

      await authPost('/api/media/upload', formData)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/media/upload'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Headers)
        })
      )

      const callArgs = mockFetch.mock.calls[0]
      const headers = callArgs[1].headers as Headers
      expect(headers.get('Authorization')).toBe(`Bearer ${mockToken}`)
    })
  })
})
