/**
 * Turns a storefront's brand settings into CSS variables scoped to the storefront root.
 *
 * The app's design tokens are HSL triples (`--primary: 222 47% 11%`); overriding them inside the
 * storefront makes every shared component (buttons, badges, focus rings) wear the vendor's colors.
 * The storefront's own styles read the `--sf-*` variables.
 */
import type { CSSProperties } from 'react'
import { STOREFRONT_FONTS, readableTextOn, type StorefrontConfig } from '@packages/shared/storefront'

/** `#rrggbb` → `h s% l%`, the form the app's tokens use. */
export function hexToHslTriple(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = (max + min) / 2
  let hue = 0
  let saturation = 0
  if (max !== min) {
    const d = max - min
    saturation = lightness > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) hue = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) hue = (b - r) / d + 2
    else hue = (r - g) / d + 4
    hue *= 60
  }
  return `${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`
}

export function storefrontThemeStyle(brand: StorefrontConfig['brand']): CSSProperties {
  const onPrimary = readableTextOn(brand.primary)
  const onAccent = readableTextOn(brand.accent)
  const heading = STOREFRONT_FONTS.find((font) => font.id === brand.font)?.heading ?? STOREFRONT_FONTS[0].heading
  return {
    '--primary': hexToHslTriple(brand.primary),
    '--primary-foreground': hexToHslTriple(onPrimary),
    '--ring': hexToHslTriple(brand.primary),
    '--sf-primary': brand.primary,
    '--sf-on-primary': onPrimary,
    '--sf-accent': brand.accent,
    '--sf-on-accent': onAccent,
    '--sf-heading': heading,
  } as CSSProperties
}

/** The class that sets the storefront's light or dark surface, whatever the rest of the app uses. */
export function storefrontAppearanceClass(appearance: StorefrontConfig['brand']['appearance']): string {
  if (appearance === 'dark') return 'dark sf-dark'
  if (appearance === 'light') return 'sf-light'
  return ''
}
