/**
 * Brand: tagline, color palette (curated pairings or a checked custom pair), light or dark, heading font.
 * The business name and logo are the store's own details and are edited in settings.
 */
import { Link } from 'react-router-dom'
import { AlertTriangle, Check } from 'lucide-react'
import {
  STOREFRONT_FONTS,
  STOREFRONT_LIMITS,
  STOREFRONT_PALETTES,
  contrastRatio,
  isHexColor,
  readableTextOn,
} from '@packages/shared/storefront'
import { cn } from '@shared/lib/cn'
import { vendorPaths } from '@shared/lib/utils/navigation/vendorPaths'
import { Choice, Field, PanelSection, inputClass } from './controls'
import type { PanelProps } from './types'

export function BrandPanel({ storeId, draft, update, storeName, logoUrl }: PanelProps & {
  readonly storeName: string
  readonly logoUrl: string | null
}) {
  const brand = draft.brand
  const setBrand = (patch: Partial<typeof brand>) => update((d) => ({ ...d, brand: { ...d.brand, ...patch } }))
  const custom = brand.paletteId === 'custom'
  // Checked only once both colors are complete; a half-typed hex has nothing to measure.
  const colorsValid = isHexColor(brand.primary) && isHexColor(brand.accent)
  const textContrast = colorsValid ? contrastRatio(brand.primary, readableTextOn(brand.primary)) : 21
  const accentContrast = colorsValid ? contrastRatio(brand.accent, brand.appearance === 'dark' ? '#111111' : '#ffffff') : 21

  return (
    <div className="space-y-5">
      <PanelSection
        title="Business"
        description={
          <>
            Your name and logo appear everywhere on ShopShop, so they’re changed in{' '}
            <Link to={vendorPaths.settings(storeId)} className="font-medium text-primary hover:underline">
              store settings
            </Link>{' '}
            and go live right away.
          </>
        }
      >
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-12 w-12 rounded-xl object-cover ring-1 ring-border" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground">No logo</div>
          )}
          <p className="font-semibold">{storeName}</p>
        </div>
        <Field label="Tagline" hint={`${brand.tagline.length}/${STOREFRONT_LIMITS.tagline} · shown under your name`}>
          {(id) => (
            <input
              id={id}
              className={inputClass}
              value={brand.tagline}
              maxLength={STOREFRONT_LIMITS.tagline}
              placeholder="Wood-fired pizza since 1998"
              onChange={(e) => setBrand({ tagline: e.target.value })}
            />
          )}
        </Field>
      </PanelSection>

      <PanelSection title="Colors" description="Pairings chosen to stay readable. Your primary color fills buttons; the accent marks highlights.">
        <ul className="grid grid-cols-4 gap-2" aria-label="Color palettes">
          {STOREFRONT_PALETTES.map((palette) => {
            const selected = brand.paletteId === palette.id
            return (
              <li key={palette.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={palette.name}
                  title={palette.name}
                  onClick={() => setBrand({ paletteId: palette.id, primary: palette.primary, accent: palette.accent })}
                  className={cn(
                    'relative flex h-12 w-full overflow-hidden rounded-lg ring-offset-2 ring-offset-background',
                    selected ? 'ring-2 ring-foreground' : 'ring-1 ring-border hover:ring-foreground/40',
                  )}
                >
                  <span className="flex-[3]" style={{ background: palette.primary }} />
                  <span className="flex-[1]" style={{ background: palette.accent }} />
                  {selected ? (
                    <Check className="absolute left-1.5 top-1.5 h-4 w-4" style={{ color: readableTextOn(palette.primary) }} aria-hidden />
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
        <button
          type="button"
          aria-pressed={custom}
          onClick={() => setBrand({ paletteId: 'custom' })}
          className={cn('text-xs font-medium', custom ? 'text-foreground' : 'text-primary hover:underline')}
        >
          {custom ? 'Custom colors' : 'Use my own colors'}
        </button>
        {custom ? (
          <div className="grid grid-cols-2 gap-3">
            <ColorInput label="Primary" value={brand.primary} onChange={(primary) => setBrand({ primary })} />
            <ColorInput label="Accent" value={brand.accent} onChange={(accent) => setBrand({ accent })} />
            {textContrast < 4.5 ? (
              <Warning>Text on your primary color is hard to read ({textContrast.toFixed(1)}:1). Try a darker or brighter shade.</Warning>
            ) : null}
            {accentContrast < 3 ? (
              <Warning>Your accent blends into the page background. Pick a stronger shade.</Warning>
            ) : null}
          </div>
        ) : null}
      </PanelSection>

      <PanelSection title="Appearance">
        <Choice
          label="Light or dark"
          value={brand.appearance}
          onChange={(appearance) => setBrand({ appearance })}
          options={[
            { id: 'light', label: 'Light' },
            { id: 'dark', label: 'Dark' },
            { id: 'system', label: 'Match device' },
          ]}
        />
      </PanelSection>

      <PanelSection title="Heading font">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Heading font">
          {STOREFRONT_FONTS.map((font) => (
            <button
              key={font.id}
              type="button"
              role="radio"
              aria-checked={brand.font === font.id}
              onClick={() => setBrand({ font: font.id })}
              className={cn(
                'rounded-lg border p-2 text-left',
                brand.font === font.id ? 'border-foreground' : 'border-border hover:border-foreground/40',
              )}
            >
              <span className="block text-lg font-bold leading-none" style={{ fontFamily: font.heading }}>
                Aa
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">{font.name}</span>
            </button>
          ))}
        </div>
      </PanelSection>
    </div>
  )
}

function ColorInput({ label, value, onChange }: { readonly label: string; readonly value: string; readonly onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      {(id) => (
        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label={`${label} color picker`}
            value={isHexColor(value) ? value : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-10 shrink-0 cursor-pointer rounded border border-input bg-background p-0.5"
          />
          <input
            id={id}
            className={inputClass}
            value={value}
            maxLength={7}
            spellCheck={false}
            onChange={(e) => onChange(e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`)}
          />
        </div>
      )}
    </Field>
  )
}

function Warning({ children }: { readonly children: React.ReactNode }) {
  return (
    <p className="col-span-2 flex gap-1.5 rounded-md bg-amber-500/10 p-2 text-xs text-amber-800 dark:text-amber-300" role="status">
      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
      {children}
    </p>
  )
}
