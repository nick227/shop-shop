/**
 * Media utility functions;
 */

/**
 * Truncate URL to specified length;
 */
export function truncateUrl(url: string, maxLength = 50): string {
  if (url.length <= maxLength) {
    return url;
  }
  
  const start = Math.floor((maxLength - 3) / 2)
  const end = Math.ceil((maxLength - 3) / 2)
  
  return url.slice(0, Math.max(0, start)) + '...' + url.slice(Math.max(0, url.length - end))
}

/**
 * Format count with K/M suffixes;
 */
export function formatCount(count: number): string {
  if (count < 1000) {
    return count.toString()
  }
  
  if (count < 1_000_000) {
    return (count / 1000).toFixed(1) + 'K'
  }
  
  return (count / 1_000_000).toFixed(1) + 'M'
}

