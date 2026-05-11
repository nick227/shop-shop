import React from 'react'
import { Link } from 'react-router-dom'

interface SiteBrandingProps {
  className?: string
}

export function SiteBranding({ className = '' }: Readonly<SiteBrandingProps>) {
  return (
    <Link 
      to="/river" 
      className={`flex gap-2 items-center text-xl font-bold text-gray-800 transition-colors hover:text-gray-600 ${className}`}
    >
      <div className="flex justify-center items-center w-8 h-8 bg-white rounded-lg">
        <img src="/logo.png" alt="Logo" className="object-contain w-full h-full" />
      </div>
      <span className="text-green-900">BagLunch</span>
    </Link>
  )
}
