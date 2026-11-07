import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveBrowserAssetUrl } from './resolveBrowserAssetUrl'

const API = 'https://api.example.com'

afterEach(() => vi.unstubAllEnvs())

describe('resolveBrowserAssetUrl', () => {
  it.each([
    ['/uploads/seed/a.jpg', `${API}/uploads/seed/a.jpg`],
    ['uploads/seed/a.jpg', `${API}/uploads/seed/a.jpg`],
    ['  /uploads/a.jpg ', `${API}/uploads/a.jpg`],
    ['/api/media/1', `${API}/api/media/1`],
  ])('sends %s to the API host', (input, expected) => {
    vi.stubEnv('VITE_API_URL', API)
    expect(resolveBrowserAssetUrl(input)).toBe(expected)
  })

  it.each(['/api', '/api/v1', '/'])('normalizes VITE_API_URL ending in %s', (suffix) => {
    vi.stubEnv('VITE_API_URL', `${API}${suffix}`)
    expect(resolveBrowserAssetUrl('/uploads/a.jpg')).toBe(`${API}/uploads/a.jpg`)
  })

  it('keeps /uploads same-origin for the dev proxy when VITE_API_URL is empty', () => {
    vi.stubEnv('VITE_API_URL', '')
    expect(resolveBrowserAssetUrl('/uploads/a.jpg')).toBe('/uploads/a.jpg')
  })

  it.each([
    'https://cdn.example.com/a.jpg',
    'http://cdn.example.com/a.jpg',
    '//cdn.example.com/a.jpg',
    'data:image/png;base64,AAAA',
    'blob:https://shop.example.com/1',
  ])('leaves %s unchanged', (input) => {
    vi.stubEnv('VITE_API_URL', API)
    expect(resolveBrowserAssetUrl(input)).toBe(input)
  })

  it.each(['/editorial/zilker.jpg', '/placeholder-store.jpg', '/uploadsish/a.jpg'])(
    'keeps web app asset %s on the web origin',
    (input) => {
      vi.stubEnv('VITE_API_URL', API)
      expect(resolveBrowserAssetUrl(input)).toBe(input)
    },
  )

  it('repairs a URL missing a slash after the scheme', () => {
    expect(resolveBrowserAssetUrl('https:/cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg')
  })

  it('passes empty values through', () => {
    expect(resolveBrowserAssetUrl(null)).toBeUndefined()
    expect(resolveBrowserAssetUrl(undefined)).toBeUndefined()
    expect(resolveBrowserAssetUrl('  ')).toBe('')
  })

  it('is idempotent', () => {
    vi.stubEnv('VITE_API_URL', API)
    const once = resolveBrowserAssetUrl('/uploads/a.jpg')
    expect(resolveBrowserAssetUrl(once)).toBe(once)
  })
})
