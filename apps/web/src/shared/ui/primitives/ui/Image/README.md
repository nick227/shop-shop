# Image Component

Global image component with skeleton loading and graceful fallback handling.

## Features

- ✅ **Skeleton Loading** - Animated shimmer effect while image loads
- ✅ **Graceful Fallback** - Colored background with alt text for broken images
- ✅ **Consistent Colors** - Same seed generates same fallback color
- ✅ **Type Safe** - Full TypeScript support
- ✅ **Drop-in Replacement** - Works like native `<img>` tag
- ✅ **Accessible** - Proper ARIA labels for fallback states

## Usage

### Basic Usage

```tsx
import { Image } from '@/components/ui'

function MyComponent() {
  return (
    <Image 
      src="https://example.com/image.jpg" 
      alt="Product Image" 
    />
  )
}
```

### With Custom Fallback Seed

Use `fallbackSeed` to ensure the same color for related images:

```tsx
<Image 
  src={store.imageUrl}
  alt={store.name}
  fallbackSeed={store.id} // Same store = same color
/>
```

### With Container Styling

```tsx
<div className={styles.imageWrapper}>
  <Image 
    src={item.imageUrl}
    alt={item.title}
    containerClassName={styles.imageContainer}
    className={styles.image}
  />
</div>
```

### With Native HTML Attributes

All native `img` attributes are supported:

```tsx
<Image 
  src={url}
  alt="Lazy loaded image"
  loading="lazy"
  decoding="async"
  width={300}
  height={200}
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `src` | `string` | ✅ | - | Image source URL |
| `alt` | `string` | ✅ | - | Alternative text for accessibility |
| `fallbackSeed` | `string` | ❌ | `src` | Seed for consistent fallback color |
| `containerClassName` | `string` | ❌ | `''` | CSS class for container div |
| `className` | `string` | ❌ | `''` | CSS class for img element |
| ...rest | `HTMLImageElement` | ❌ | - | All native img attributes |

## Architecture

### Files

```
Image/
├── Image.tsx           # Main component
├── Image.module.css    # Styles with skeleton animation
├── Image.test.tsx      # Unit tests
├── Image.example.tsx   # Usage examples
├── index.ts            # Exports
└── README.md           # This file
```

### Dependencies

- `useImageLoader` hook - Manages loading/error state
- `generateColorFromSeed` util - Creates consistent colors

### State Flow

```
Initial: loading=true, error=false
   ↓
[Image loads successfully]
   ↓
loading=false, error=false (show image)

OR

[Image fails to load]
   ↓
loading=false, error=true (show fallback)
```

## Behavior

### Loading State
- Shows animated skeleton with shimmer effect
- Image hidden until loaded
- Skeleton removed when image loads

### Error State
- Shows colored background based on `fallbackSeed`
- Displays alt text in center
- Accessible via ARIA role="img"

### Color Consistency
- Same `fallbackSeed` = same color
- Uses HSL color space for pleasant colors
- Hue: 0-360° (based on seed hash)
- Saturation: 60% (muted)
- Lightness: 75% (pastel)

## Testing

Run tests:
```bash
pnpm test Image.test.tsx
```

Coverage includes:
- Skeleton display during load
- Skeleton removal on success
- Fallback display on error
- Color consistency with seeds
- HTML attribute passthrough
- Accessibility attributes

## Migration Guide

### Before
```tsx
<img src={imageUrl} alt="Store" />
```

### After
```tsx
import { Image } from '@/components/ui'

<Image src={imageUrl} alt="Store" />
```

### Benefits
1. No flash of unstyled content
2. Professional loading experience
3. Graceful error handling
4. Zero configuration
5. Consistent UX across app

## CSS Customization

Override styles using CSS modules:

```css
/* YourComponent.module.css */
.customContainer {
  border-radius: 12px;
  overflow: hidden;
}

.customImage {
  object-fit: contain;
}
```

```tsx
<Image 
  src={url}
  alt="Custom styled"
  containerClassName={styles.customContainer}
  className={styles.customImage}
/>
```

## Performance

- **Lightweight**: ~2KB gzipped
- **Zero Dependencies**: Uses native browser APIs
- **Optimized**: Memoized color generation
- **Efficient**: Stable callback references

## Accessibility

- Preserves `alt` text in all states
- Fallback uses `role="img"` with `aria-label`
- Supports all ARIA attributes
- Keyboard navigable (if wrapped in interactive element)

## Future Enhancements

Potential additions (not implemented):
- Lazy loading with Intersection Observer
- Blur-up placeholder from base64
- Retry logic for failed loads
- Image size optimization hints
- Progress tracking for large images

