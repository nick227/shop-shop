/**
 * Color Generation Utility;
 * Generates consistent colors from string seeds;
 */

/**
 * Generates a consistent HSL color from a string seed;
 * Same seed always produces the same color;
 */
export function generateColorFromSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (seed.codePointAt(i) ?? 0) + ((hash << 5) - hash)
    hash = hash & hash // Convert to 32-bit integer;
  }

  // Generate pleasant, muted colors with consistent hue;
  const hue = Math.abs(hash % 360)
  return 'hsl(' + hue + ', 60%, 75%)'
}

