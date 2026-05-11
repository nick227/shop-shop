import { describe, expect, it } from 'vitest'
import { diversifyRiverFeedCandidates } from './river-feed-diversify.js'

function row(
  id: string,
  storeId: string,
  overrides: Partial<{ contentType: string | null; packageId: string | null; duplicateKey: string | null }> = {},
) {
  return {
    id,
    storeId,
    contentType: overrides.contentType ?? null,
    packageId: overrides.packageId ?? null,
    duplicateKey: overrides.duplicateKey ?? null,
  }
}

describe('diversifyRiverFeedCandidates', () => {
  it('interleaves two stores that were adjacent in rank order', () => {
    const ordered = [
      row('1', 'a'),
      row('2', 'a'),
      row('3', 'b'),
      row('4', 'b'),
    ]
    const out = diversifyRiverFeedCandidates(ordered)
    expect(out.map((p) => p.storeId).join('')).not.toBe('aaaabbbb')
    expect(out[0]?.storeId).toBe('a')
    expect(out[1]?.storeId).toBe('b')
  })

  it('falls back to rank order when constraints cannot be satisfied', () => {
    const ordered = [row('1', 'same'), row('2', 'same'), row('3', 'same')]
    const out = diversifyRiverFeedCandidates(ordered)
    expect(out).toHaveLength(3)
    expect(out.map((p) => p.id)).toEqual(['1', '2', '3'])
  })
})
