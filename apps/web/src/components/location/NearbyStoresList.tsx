/**
 * NearbyStoresList - Display nearby stores with distance and delivery info
 * Simple list view for MVP (no map required)
 */

import React from 'react';
import { useLocationService } from '../../hooks/location/useLocationService';
import type { StoreWithDistance } from '../../services/LocationService';

interface NearbyStoresListProps {
  onStoreSelect?: (store: StoreWithDistance) => void;
  maxDistance?: number; // miles
}

export function NearbyStoresList({ onStoreSelect, maxDistance = 25 }: NearbyStoresListProps) {
  const { location, isLoading, error, nearbyStores, refreshLocation } = useLocationService();

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Finding nearby stores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-600 mb-4">
          <p className="font-semibold">Location Error</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={refreshLocation}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600">Location not available</p>
        <button
          onClick={refreshLocation}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Enable Location
        </button>
      </div>
    );
  }

  const filteredStores = nearbyStores.filter(store => store.distance <= maxDistance);

  if (filteredStores.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600">No stores found within {maxDistance} miles</p>
        <button
          onClick={refreshLocation}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh Location
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Nearby Stores</h3>
        <button
          onClick={refreshLocation}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {filteredStores.map((store) => (
          <StoreCard
            key={store.id}
            store={store}
            onSelect={() => onStoreSelect?.(store)}
          />
        ))}
      </div>
    </div>
  );
}

interface StoreCardProps {
  store: StoreWithDistance;
  onSelect: () => void;
}

function StoreCard({ store, onSelect }: StoreCardProps) {
  return (
    <div
      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-900">{store.name}</h4>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">
            {store.distance.toFixed(1)} mi
          </div>
          <div className="text-xs text-gray-500">
            ~{store.travelTime} min
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3">{store.address}</p>

      <div className="flex justify-between items-center">
        <DeliveryStatus store={store} />
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          View Store
        </button>
      </div>
    </div>
  );
}

function DeliveryStatus({ store }: { store: StoreWithDistance }) {
  if (store.isDeliverable) {
    return (
      <div className="flex items-center text-green-600">
        <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
        <span className="text-sm font-medium">
          Delivery {store.deliveryFee ? `$${store.deliveryFee.toFixed(2)}` : 'Available'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-gray-500">
      <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
      <span className="text-sm">Pickup Only</span>
    </div>
  );
}
