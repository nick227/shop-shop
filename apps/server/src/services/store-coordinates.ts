/** Record an explicitly supplied coordinate pair, including browser-detected locations. */
export function recordStoreCoordinates<T extends Record<string, unknown>>(data: T): T {
  const { latitude, longitude } = data
  if (latitude === undefined || longitude === undefined) return data
  const lat = Number(latitude)
  const lng = Number(longitude)
  if (latitude === null || longitude === null || String(latitude).trim() === '' || String(longitude).trim() === '' ||
      !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) return data
  return { ...data, geocodedAt: new Date().toISOString(), geocodeSource: 'manual' }
}
