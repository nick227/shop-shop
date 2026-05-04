export type RiverIngestResult = Readonly<{
  created: number
  skippedExisting: number
  skippedNoMedia: number
  skippedCooldown: number
  errors: number
}>
