/**
 * Progressive input masks for US-style phone, email characters, and ZIP+4.
 */

function formatUsPhoneBody(digits: string): string {
  const n = digits.slice(0, 10)
  if (n.length === 0) return ''
  if (n.length <= 3) return `(${n}`
  if (n.length <= 6) return `(${n.slice(0, 3)}) ${n.slice(3)}`
  return `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}`
}

/** US phone: (555) 123-4567 or +1 (555) 123-4567 */
export function maskUsPhoneInput(value: string): string {
  const digits = value.replaceAll(/\D/g, '')
  if (digits.length === 0) return ''
  if (digits === '1') return '+1 '
  if (digits.startsWith('1') && digits.length >= 2) {
    return '+1 ' + formatUsPhoneBody(digits.slice(1, 11))
  }
  return formatUsPhoneBody(digits.slice(0, 10))
}

/** Allows only characters valid in typical email local/domain parts */
export function maskEmailInput(value: string): string {
  return value.replace(/[^a-zA-Z0-9@._%+-]/g, '')
}

/** US ZIP: 12345 or 12345-6789 */
export function maskUsZipInput(value: string): string {
  const d = value.replaceAll(/\D/g, '').slice(0, 9)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}
