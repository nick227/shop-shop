/**
 * Image Component
 * Global image component with skeleton loading, fallback handling, and lazy loading
 * Performance: Native lazy loading, memoized colors, optimized rendering
 */
import { useMemo, memo } from 'react'
import { useImageLoader } from '@hooks/useImageLoader'
import { generateColorFromSeed } from '@utils/colorGenerator'
import { styles } from '@utils/tailwind-classes'

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  fallbackSeed?: string | undefined
  containerClassName?: string | undefined
  aspectRatio?: string | undefined
}

function ImageComponent({
  src,
  alt,
  fallbackSeed = src,
  className = '',
  containerClassName = '',
  aspectRatio,
  loading: loadingProp = 'lazy', // Default to lazy loading
  ...props
}: ImageProps) {
  const { loading, error, handleLoad, handleError } = useImageLoader(src)
  const fallbackColor = useMemo(
    () => generateColorFromSeed(fallbackSeed),
    [fallbackSeed]
  )

  const containerStyle = useMemo(
    () => aspectRatio ? { aspectRatio } : undefined,
    [aspectRatio]
  )

  const imageClassNames = useMemo(() => [
    styles['image'],
    loading && styles['image--hidden'],
    className,
  ]
    .filter(Boolean)
    .join(' '), [loading, className])

  if (error) {
    return (
      <div
        className={'relative overflow-hidden ' + containerClassName + ''}
        style={{ ...containerStyle, backgroundColor: fallbackColor }}
      >
        <div className={styles['fallback']} role="img" aria-label={alt}>
          {alt}
        </div>
      </div>
    )
  }

  return (
    <div className={'relative overflow-hidden ' + containerClassName + ''} style={containerStyle}>
      {loading && <div className="absolute inset-0 bg-muted animate-pulse" />}
      <img
        src={src}
        alt={alt}
        className={imageClassNames}
        loading={loadingProp} // Native lazy loading
        decoding="async" // Asynchronous image decoding
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  )
}

// Memoize to prevent unnecessary re-renders
export const Image = memo(ImageComponent)

