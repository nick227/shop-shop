const BLOCKED = [
  /^\/vendor(?:\/|$)/,
  /^\/admin(?:\/|$)/,
  /^\/affiliate(?:\/|$)/,
  /^\/login$/,
  /^\/signup$/,
  /^\/driver(?:\/|$)/,
  /^\/become-affiliate$/,
  /^\/r\//,
  /^\/terms$/,
  /^\/privacy$/,
  /^\/refund-policy$/,
]

const SHOPPING = /^\/($|river$|search$|kitchen\/|items\/|cart$|checkout$|orders(?:\/|$)|menu(?:\/|$)|account(?:\/|$))/

export function isShoppingPath(pathname: string): boolean {
  if (BLOCKED.some((pattern) => pattern.test(pathname))) return false
  return SHOPPING.test(pathname)
}
