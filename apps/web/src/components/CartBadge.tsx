import React, { useEffect, useState, useRef } from 'react';
import { formatCurrency } from '@shared/lib/format';
import { useCartAnimations } from '@features/cart/utils/cartAnimations';

interface CartBadgeProps {
  count: number;
  total?: number;
  showTotal?: boolean;
  className?: string;
  onClick?: () => void;
}

export const CartBadge: React.FC<CartBadgeProps> = ({ 
  count, 
  total, 
  showTotal = false, 
  className = '',
  onClick 
}) => {
  const [displayCount, setDisplayCount] = useState(count);
  const [displayTotal, setDisplayTotal] = useState(total);
  const [isAnimating, setIsAnimating] = useState(false);
  const badgeRef = useRef<HTMLButtonElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const { animations, createRipple } = useCartAnimations();

  // Handle count changes with animation
  useEffect(() => {
    if (count !== displayCount) {
      setIsAnimating(true);
      
      // Animate number change if we have the element
      if (countRef.current && displayCount !== undefined) {
        const from = displayCount;
        const to = count;
        
        // Simple immediate update for now, could enhance with number animation
        setDisplayCount(count);
        
        // Trigger bounce animation
        if (badgeRef.current) {
          badgeRef.current.classList.add('animate-bounce-gentle');
          setTimeout(() => {
            badgeRef.current?.classList.remove('animate-bounce-gentle');
          }, 600);
        }
      } else {
        setDisplayCount(count);
      }
      
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }
  }, [count, displayCount]);

  // Handle total changes
  useEffect(() => {
    if (total !== displayTotal) {
      setDisplayTotal(total);
      
      // Trigger subtle scale animation for total changes
      if (badgeRef.current && showTotal) {
        badgeRef.current.classList.add('scale-105');
        setTimeout(() => {
          badgeRef.current?.classList.remove('scale-105');
        }, 200);
      }
    }
  }, [total, displayTotal, showTotal]);

  const svgColor = count > 0 ? 'text-green-600' : 'text-gray-600';
  const hasItems = count > 0;

  const handleClick = (event: React.MouseEvent) => {
    // Create ripple effect
    if (badgeRef.current) {
      createRipple(event, badgeRef.current);
    }
    
    // Call original onClick
    onClick?.();
  };

  return (
    <button
      ref={badgeRef}
      type="button"
      onClick={handleClick}
      className={`relative flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 tap-scale ${animations.badge.smooth} ${className}`}
      aria-label={`Cart with ${count} items${total ? ` totaling ${formatCurrency(total)}` : ''}`}
    >
      <svg 
        className={`w-6 h-6 ${svgColor} transition-colors duration-200 ${hasItems ? 'animate-pulse' : ''}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      
      {/* Item Count Badge */}
      {hasItems && (
        <span 
          ref={countRef}
          className={`absolute -top-1 -right-1 bg-green-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center transform transition-all duration-300 shadow-sm ${
            isAnimating ? 'scale-125 shadow-md' : 'scale-100'
          }`}
        >
          {displayCount > 99 ? '99+' : displayCount}
        </span>
      )}

      {/* Total Cost Display */}
      {showTotal && total !== undefined && hasItems && (
        <div className="hidden sm:block">
          <div className="text-sm font-medium text-gray-900 transition-all duration-200">
            {formatCurrency(displayTotal || 0)}
          </div>
        </div>
      )}
    </button>
  );
};
