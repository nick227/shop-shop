import { describe, expect, it } from 'vitest'
import { canonicalMediaType, validateMediaFile } from './storage.adapter.js'

describe('canonicalMediaType', () => {
  it('treats jpeg aliases and a .jpg name as image/jpeg', () => {
    expect(canonicalMediaType('image/pjpeg', 'plate.jpg')).toBe('image/jpeg')
    expect(canonicalMediaType('image/jpg', 'plate.jpg')).toBe('image/jpeg')
    expect(canonicalMediaType('application/octet-stream', 'plate.jpg')).toBe('image/jpeg')
    expect(canonicalMediaType('', 'plate.JPEG')).toBe('image/jpeg')
  })
})

describe('validateMediaFile', () => {
  it('accepts a jpg', () => {
    expect(validateMediaFile('image/jpeg', 1200, 'plate.jpg').valid).toBe(true)
    expect(validateMediaFile('image/pjpeg', 1200, 'plate.jpg').valid).toBe(true)
    expect(validateMediaFile('application/octet-stream', 1200, 'plate.jpg').valid).toBe(true)
  })

  it('reports an oversized image as too large', () => {
    const result = validateMediaFile('image/jpeg', 11 * 1024 * 1024, 'plate.jpg')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('too large')
  })

  it('rejects a file that is neither an image nor a video', () => {
    const result = validateMediaFile('application/pdf', 1200, 'menu.pdf')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid file type. Must be image or video.')
  })
})
