import { cn } from '@shared/lib/cn'

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.length > 1 ? [words[0][0], words[1][0]] : [words[0]?.[0], words[0]?.[1]]
  return letters.filter(Boolean).join('').toUpperCase() || '?'
}

interface StoreAvatarProps {
  readonly name: string
  readonly imageUrl?: string | null
  readonly size?: 'sm' | 'md'
  readonly className?: string
}

export function StoreAvatar({ name, imageUrl, size = 'md', className }: StoreAvatarProps) {
  const box = size === 'sm' ? 'h-7 w-7 text-[11px]' : 'h-9 w-9 text-xs'
  if (imageUrl) {
    return <img src={imageUrl} alt="" className={cn('shrink-0 rounded-lg object-cover', box, className)} />
  }
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg bg-foreground font-semibold text-background',
        box,
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
