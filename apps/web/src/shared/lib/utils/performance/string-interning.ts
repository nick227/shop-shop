/**
 * String Interning - Memory optimization for repeated strings
 * Reduces memory usage by reusing string instances
 */

const stringPool = new Map<string, string>()

/**
 * Intern a string to reduce memory usage
 * @param str - The string to intern
 * @returns The interned string
 */
export function internString(str: string): string {
  if (stringPool.has(str)) {
    return stringPool.get(str)!
  }
  
  stringPool.set(str, str)
  return str
}

/**
 * Clear the string pool
 */
export function clearStringPool(): void {
  stringPool.clear()
}

/**
 * Get the current pool size
 */
export function getPoolSize(): number {
  return stringPool.size
}
