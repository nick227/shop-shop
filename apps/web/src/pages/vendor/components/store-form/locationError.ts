export async function locationError(error: unknown): Promise<{ message: string; details: string }> {
  const failure = error as { code?: number; name?: string; message?: string } | null
  let permission: PermissionState | undefined
  try { permission = (await navigator.permissions?.query({ name: 'geolocation' }))?.state } catch { /* Not supported by every browser. */ }
  const policy = document as Document & { permissionsPolicy?: { allowsFeature(name: string): boolean }; featurePolicy?: { allowsFeature(name: string): boolean } }
  const blockedByPage = (policy.permissionsPolicy ?? policy.featurePolicy)?.allowsFeature('geolocation') === false
  const message = blockedByPage ? 'Location blocked by this page. Open in a browser tab.'
    : permission === 'denied' || failure?.code === 1 || failure?.name === 'NotAllowedError' ? 'Location blocked. Allow Location in site settings, then retry.'
    : failure?.code === 3 ? 'Location timed out. Retry or use address.'
    : failure?.code === 2 ? 'Device location unavailable. Use address instead.'
    : 'Location failed. Use address instead.'
  const details = [permission ? `Permission: ${permission}` : '', failure?.code ? `Code: ${failure.code}` : '', failure?.message || failure?.name || ''].filter(Boolean).join(' · ')
  return { message, details }
}
