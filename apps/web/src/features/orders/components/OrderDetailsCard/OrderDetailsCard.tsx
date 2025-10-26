/**
 * OrderDetailsCard - Order details display
 * Extracted from OrderTrackingPage for SRP compliance
 */
import { formatPriceCurrency } from '@utils/format'
import type { AddressSnapshot } from '@api/types'

interface OrderItem {
  quantity: number
  titleSnapshot: string
  unitPrice: string | number
}

export interface OrderDetailsCardProps {
  storeName?: string
  deliveryType: 'DELIVERY' | 'PICKUP'
  items?: OrderItem[]
  subtotal: string | number
  fees: string | number
  tax: string | number
  tip?: string | number
  total: string | number
  paymentMethod?: string
  address?: AddressSnapshot | null
}

export function OrderDetailsCard({
  storeName,
  deliveryType,
  items,
  subtotal,
  fees,
  tax,
  tip,
  total,
  paymentMethod,
  address,
}: OrderDetailsCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-lg">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Order Details</h2>

      {/* Restaurant */}
      {storeName && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="text-sm font-medium text-gray-500">Restaurant</div>
          <div className="text-base font-semibold text-gray-900">{storeName}</div>
        </div>
      )}

      {/* Type */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="text-sm font-medium text-gray-500">Type</div>
        <div className="text-base font-semibold text-gray-900">
          {deliveryType === 'DELIVERY' ? '🚗 Delivery' : '🏃 Pickup'}
        </div>
      </div>

      {/* Items */}
      {items && items.length > 0 && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-2">Items</div>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700 mr-2">{item.quantity}x</span>
                <span className="flex-1 text-sm text-gray-900">{item.titleSnapshot}</span>
                <span className="text-sm font-semibold text-gray-900 ml-2">
                  {formatPriceCurrency(item.unitPrice)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Summary */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-900">{formatPriceCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fees & Delivery</span>
            <span className="font-medium text-gray-900">{formatPriceCurrency(fees)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium text-gray-900">{formatPriceCurrency(tax)}</span>
          </div>
          {tip && Number.parseFloat(tip.toString()) > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Tip</span>
              <span className="font-medium text-gray-900">{formatPriceCurrency(tip)}</span>
            </div>
          )}
        </div>
        <div className="h-px bg-gray-300 my-3" />
        <div className="flex justify-between text-lg font-bold">
          <span className="text-gray-900">Total</span>
          <span className="text-gray-900">{formatPriceCurrency(total)}</span>
        </div>
      </div>

      {/* Payment */}
      {paymentMethod && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="text-sm font-medium text-gray-500">Payment</div>
          <div className="text-base font-semibold text-gray-900">{paymentMethod}</div>
        </div>
      )}

      {/* Delivery Address */}
      {deliveryType === 'DELIVERY' && address && (
        <div>
          <div className="text-sm font-medium text-gray-500 mb-1">Delivery Address</div>
          <div className="text-sm text-gray-900">
            {address["line1"]}
            {address.line2 && (
              <>
                <br />{address.line2}
              </>
            )}
            <br />
            {address["city"]}, {address["state"]} {address["postalCode"]}
          </div>
        </div>
      )}
    </div>
  )
}

