import React from 'react'
import { Link } from 'react-router-dom'

interface SiteBrandingProps {
  className?: string
}

export function SiteBranding({ className = '' }: SiteBrandingProps) {
  return (
    <Link 
      to="/" 
      className={`flex items-center gap-2 text-xl font-bold text-gray-800 hover:text-gray-600 transition-colors ${className}`}
    >
      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-sm">SS</span>
      </div>
      <span>Shop Shop</span>
    </Link>
  )
}
