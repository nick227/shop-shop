/* eslint-disable import/no-deprecated -- lucide brand icons marked deprecated; no stable replacements in-package */
import type React from 'react'
import {
  Youtube,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  MessageSquare,
  Music,
  Ghost,
} from 'lucide-react'
import type { StoreSocialLinks } from '@api/types'

function socialUrlFor(platform: keyof StoreSocialLinks, value: string): string {
  const v = value.trim()
  const handle = v.startsWith('@') ? v.slice(1) : v
  switch (platform) {
    case 'youtube': {
      return `https://youtube.com/@${handle}`
    }
    case 'instagram': {
      return `https://instagram.com/${handle}`
    }
    case 'facebook': {
      return `https://facebook.com/${handle}`
    }
    case 'tiktok': {
      return `https://tiktok.com/@${handle}`
    }
    case 'twitter': {
      return `https://x.com/${handle}`
    }
    case 'whatsapp': {
      return `https://wa.me/${v.replaceAll(/\D/g, '')}`
    }
    case 'discord': {
      return v.startsWith('http') ? v : `https://discord.gg/${v}`
    }
    case 'snapchat': {
      return `https://snapchat.com/add/${handle}`
    }
  }
}

const SOCIAL_ICONS: Record<keyof StoreSocialLinks, React.ReactNode> = {
  youtube: <Youtube className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
  facebook: <Facebook className="h-4 w-4" />,
  tiktok: <Music className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
  discord: <MessageSquare className="h-4 w-4" />,
  snapchat: <Ghost className="h-4 w-4" />,
}

export interface StoreHeaderSocialRowProps {
  readonly entries: readonly (readonly [keyof StoreSocialLinks, string])[]
}

export function StoreHeaderSocialRow({ entries }: StoreHeaderSocialRowProps) {
  return (
    <nav aria-label="Social links" className="mt-5 flex flex-wrap gap-2">
      {entries.map(([platform, value]) => (
        <a
          key={platform}
          href={socialUrlFor(platform, value)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
          aria-label={platform}
        >
          {SOCIAL_ICONS[platform]}
        </a>
      ))}
    </nav>
  )
}
