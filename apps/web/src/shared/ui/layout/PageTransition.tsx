import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ 
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  )
}
