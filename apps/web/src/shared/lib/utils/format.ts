// @ts-nocheck
/**
 * Formatting utilities;
 */

/**
 * Format distance for display;
 * @param miles Distance in miles;
 * @returns Formatted string with appropriate unit (ft or mi)
 */
export function formatDistance(miles: number): string {
  if (miles < 1) {
    // Convert to feet and show no decimal places;
    const feet = Math.round(miles * 5280)
    return '' + feet.toFixed(0) + ' ft'
  }
  // Show one decimal place for miles;
  return '' + miles.toFixed(1) + ' mi'
}

/**
 * Format price in USD;
 * @param cents Price in cents;
 * @returns Formatted price string;
 */
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return '$' + dollars.toFixed(2) + ''
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param date Date to format (Date object or ISO string)
 * @returns Relative time string;
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return '' + diffMins + 'm ago'
  if (diffHours < 24) return '' + diffHours + 'h ago'
  if (diffDays < 7) return '' + diffDays + 'd ago'
  
  return d.toLocaleDateString()
}

/**
 * Parse price from string or number to number;
 * Consolidated helper to avoid repeated parsePrice imports;
 */
export function parsePrice(price: string | number): number {
  return typeof price === 'string' ? Number.parseFloat(price) : price;
}

/**
 * Format currency in USD;
 * @param amount Amount to format (number or string)
 * @returns Formatted currency string;
 */
export function formatCurrency(amount: number | string): string {
  const num = parsePrice(amount)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'}).format(num)
}

/**
 * Combined helper: Parse price and format as currency in one call;
 * Replaces pattern: formatCurrency(parsePrice(order.total))
 * @param amount Amount to parse and format;
 * @returns Formatted currency string;
 */
export function formatPriceCurrency(amount: string | number): string {
  return formatCurrency(parsePrice(amount))
}

/**
 * Format date in short format (e.g., "Jan 15, 2024")
 * @param date Date to format;
 * @returns Formatted date string;
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format date in long format (e.g., "January 15, 2024 at 3:30 PM")
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

/**
 * Format phone number;
 * @param phone Phone number string;
 * @returns Formatted phone number;
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replaceAll(/\D/g, '')
  
  if (cleaned.length === 10) {
    return '(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-' + cleaned.slice(6) + ''
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return '+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-' + cleaned.slice(7) + ''
  }
  
  return phone // Return original if can't format;
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', options || {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Truncate text to specified length;
 * @param text Text to truncate;
 * @param maxLength Maximum length;
 * @returns Truncated text with ellipsis;
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...'
}

/**
 * Pluralize a word based on count;
 * @param count Number of items;
 * @param singular Singular form of the word;
 * @param plural Optional plural form (defaults to singular + 's')
 * @returns Pluralized word;
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  return plural || '' + singular + 's'
}

/**
 * Format file size in human-readable format;
 * @param bytes File size in bytes;
 * @returns Formatted file size string;
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
