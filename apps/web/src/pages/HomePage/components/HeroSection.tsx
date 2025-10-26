/**
 * HeroSection - Component for the hero section with promotional copy;
 */
import React from 'react'

interface HeroSectionProps {
  headline: string;
  subheadline: string;
}

export function HeroSection({ headline, subheadline }: HeroSectionProps) {
  return (
    <section className="text-center py-12 px-4 text-white">
      <h1 className="text-5xl md:text-3xl font-extrabold mb-4 drop-shadow-md">{headline}</h1>
      <p className="text-xl md:text-base font-light opacity-95">{subheadline}</p>
    </section>
  )
}

