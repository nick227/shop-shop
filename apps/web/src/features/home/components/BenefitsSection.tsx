/**
 * BenefitsSection - Component for the benefits section;
 */
import React from 'react'

interface BenefitsSectionProps {
  title: string;
  items: string[]
}

export function BenefitsSection({ title, items }: BenefitsSectionProps) {
  return (
    <section className="mt-16 p-8">
      <h2 className="text-center text-white text-3xl md:text-2xl font-bold mb-8">{title}</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
        {items.map((benefit: string, idx: number) => (
          <div key={'benefit-' + idx + ''} className="bg-white/90 p-6 rounded-xl shadow-md">
            <p className="m-0 text-gray-800 text-base leading-relaxed">{benefit}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

