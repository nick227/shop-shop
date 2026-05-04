/** Defaults — override via env where noted in river.service */
export const RIVER_FEED_DEFAULT_RADIUS_MI = 25
export const RIVER_AUTO_PRODUCT_COOLDOWN_HOURS = Number(
  process.env.RIVER_AUTO_PRODUCT_COOLDOWN_HOURS ?? 24,
)
