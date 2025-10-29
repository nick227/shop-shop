import { ReactNode } from 'react'
import { cn } from './cn'
import type { ViewConfig } from '@/types/page-config.types'

/**
 * GridView - Generic grid layout component
 * Renders items in a responsive grid based on ViewConfig
 */
export interface GridViewProps<TItem = unknown> {
  items: TItem[]
  config: ViewConfig<TItem>
  testId?: string | undefined
  className?: string | undefined
}

export function GridView<TItem = unknown>({ 
  items, 
  config, 
  testId,
  className 
}: GridViewProps<TItem>) {
  const { layout, cols = 3, gap = 'medium', itemComponent } = config

  // Handle empty state
  if (items?.length === 0) {
    return (
      <div 
        className={cn('flex items-center justify-center p-8 text-muted-foreground')}
        data-testid={testId ? '' + testId + '-empty' : 'grid-empty'}
      >
        {config.emptyState || <p>No items to display</p>}
      </div>
    )
  }

  // Handle loading state
  if (config.loadingState) {
    return (
      <div 
        className={cn('flex items-center justify-center p-8')}
        data-testid={testId ? '' + testId + '-loading' : 'grid-loading'}
      >
        {config.loadingState}
      </div>
    )
  }

  // Grid gap classes
  const gapClasses = {
    none: 'gap-0',
    small: 'gap-2',
    medium: 'gap-4',
    large: 'gap-6'
  }

  // Grid column classes
  const gridClasses = {
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-' + Math.min(cols, 4) + '',
    list: 'flex flex-col space-y-2',
    carousel: 'flex overflow-x-auto space-x-4'
  }

  const baseClasses = cn(
    gridClasses[layout],
    gapClasses[gap],
    className
  )

  return (
    <div 
      className={baseClasses}
      data-testid={testId}
    >
      {items.map((item, index) => {
        const key = config.keyExtractor 
          ? config.keyExtractor(item, index)
          : index

        return (
          <div key={key}>
            {itemComponent(item, index)}
          </div>
        )
      })}
    </div>
  )
}

/**
 * ListView - Generic list layout component
 * Renders items in a vertical list
 */
export interface ListViewProps<TItem = unknown> {
  items: TItem[]
  config: ViewConfig<TItem>
  testId?: string
  className?: string
}

export function ListView<TItem = unknown>({ 
  items, 
  config, 
  testId,
  className 
}: ListViewProps<TItem>) {
  return (
    <GridView
      items={items}
      config={{ ...config, layout: 'list' }}
      testId={testId}
      className={className}
    />
  )
}

/**
 * CarouselView - Generic carousel layout component
 * Renders items in a horizontal scrollable carousel
 */
export interface CarouselViewProps<TItem = unknown> {
  items: TItem[]
  config: ViewConfig<TItem>
  testId?: string
  className?: string
}

export function CarouselView<TItem = unknown>({ 
  items, 
  config, 
  testId,
  className 
}: CarouselViewProps<TItem>) {
  return (
    <GridView
      items={items}
      config={{ ...config, layout: 'carousel' }}
      testId={testId}
      className={className}
    />
  )
}
