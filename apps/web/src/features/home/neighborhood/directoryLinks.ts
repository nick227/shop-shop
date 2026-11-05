export function directionsUrl(latitude: number, longitude: number): string {
  return `https://www.openstreetmap.org/directions?to=${latitude}%2C${longitude}`
}
