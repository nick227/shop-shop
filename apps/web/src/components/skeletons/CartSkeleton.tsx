import React from 'react';

export const CartSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4 animate-pulse">
      {/* Cart items */}
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex items-center space-x-3 pb-3 border-b border-gray-100">
            {/* Item image */}
            <div className="w-16 h-16 bg-gray-200 rounded"></div>
            
            {/* Item details */}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            
            {/* Price and quantity */}
            <div className="text-right space-y-2">
              <div className="h-4 bg-gray-200 rounded w-12 ml-auto"></div>
              <div className="h-6 bg-gray-200 rounded w-16 ml-auto"></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Total section */}
      <div className="pt-4 border-t border-gray-200 space-y-2">
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-5 bg-gray-200 rounded w-24"></div>
          <div className="h-5 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
      
      {/* Checkout button */}
      <div className="pt-4">
        <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
      </div>
    </div>
  );
};
