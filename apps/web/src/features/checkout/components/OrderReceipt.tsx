import { formatPriceCurrency } from '@shared/lib/format'
import { Clock, MapPin, Package, Phone, User, CheckCircle } from 'lucide-react'
import type { OrderItem, AddressSnapshot } from '@api/backend-types'

export interface OrderReceiptProps {
  orderId: string
  storeName: string
  storePhone?: string
  storeAddress?: AddressSnapshot
  deliveryType: 'DELIVERY' | 'PICKUP'
  deliveryMode?: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  tax: number
  tip: number
  total: number
  estimatedReadyTime?: string
  estimatedDeliveryTime?: string
  paymentMethod: string
  orderPlacedAt: string
  status: string
}

export function OrderReceipt({
  orderId,
  storeName,
  storePhone,
  storeAddress,
  deliveryType,
  deliveryMode,
  items,
  subtotal,
  deliveryFee,
  tax,
  tip,
  total,
  estimatedReadyTime,
  estimatedDeliveryTime,
  paymentMethod,
  orderPlacedAt,
  status
}: OrderReceiptProps) {
  const isDelivery = deliveryType === 'DELIVERY'
  const isCompleted = status === 'COMPLETED' || status === 'DELIVERED'
  
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">Order Confirmation</h1>
            <p className="text-blue-100">Order #{orderId}</p>
            <p className="text-sm text-blue-200 mt-1">
              Placed on {new Date(orderPlacedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            {isCompleted ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-8 h-8 text-green-300" />
                <span className="text-lg font-semibold">Completed!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Clock className="w-8 h-8 text-blue-300 animate-pulse" />
                <span className="text-lg font-semibold">In Progress</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Store & Delivery Info */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Store Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{storeName}</span>
              </div>
              {storePhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{storePhone}</span>
                </div>
              )}
              {storeAddress && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                  <div>
                    <p>{storeAddress.line1}</p>
                    <p>{storeAddress.city}, {storeAddress.state} {storeAddress.postalCode}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {isDelivery ? 'Delivery Information' : 'Pickup Information'}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                  isDelivery ? 'bg-blue-500' : 'bg-green-500'
                }`}>
                  {isDelivery ? '🚗' : '🏃'}
                </div>
                <div>
                  <p className="font-medium">
                    {isDelivery ? 'Delivery' : 'Pickup'}
                  </p>
                  {deliveryMode && (
                    <p className="text-sm text-gray-500">
                      {deliveryMode === 'STORE_MANAGED_DELIVERY' && 'Store Delivery'}
                      {deliveryMode === 'PLATFORM_DRIVER' && 'Platform Driver'}
                      {deliveryMode === 'PICKUP' && 'Self Pickup'}
                    </p>
                  )}
                </div>
              </div>
              
              {estimatedReadyTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium">Estimated Ready Time</p>
                    <p className="text-sm text-gray-600">{estimatedReadyTime}</p>
                  </div>
                </div>
              )}
              
              {isDelivery && estimatedDeliveryTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium">Estimated Delivery Time</p>
                    <p className="text-sm text-gray-600">{estimatedDeliveryTime}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-start py-2 border-b border-gray-200 last:border-0">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.titleSnapshot}</p>
                  {item.quantity > 1 && (
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  )}
                  {item.optionsSnapshot && Object.keys(item.optionsSnapshot).length > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      {Object.entries(item.optionsSnapshot).map(([key, value]) => (
                        <p key={key}>{key}: {String(value)}</p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatPriceCurrency(item.unitPrice * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Summary */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPriceCurrency(subtotal)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{formatPriceCurrency(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{formatPriceCurrency(tax)}</span>
            </div>
            {tip > 0 && (
              <div className="flex justify-between">
                <span>Tip</span>
                <span>{formatPriceCurrency(tip)}</span>
              </div>
            )}
            <div className="border-t border-gray-300 pt-2 mt-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPriceCurrency(total)}</span>
              </div>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Paid with {paymentMethod.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">What's Next?</h3>
          <div className="space-y-3">
            {isCompleted ? (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Your order has been completed!</span>
                </div>
                <p className="text-sm text-blue-700">
                  {isDelivery 
                    ? 'Your order has been delivered. Enjoy your meal!'
                    : 'You have successfully picked up your order. Enjoy your meal!'
                  }
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Your order is being prepared</span>
                </div>
                <p className="text-sm text-blue-700">
                  {isDelivery 
                    ? `We'll notify you when your order is on the way. Estimated delivery: ${estimatedDeliveryTime || 'TBD'}`
                    : `We'll notify you when your order is ready for pickup. Estimated ready time: ${estimatedReadyTime || 'TBD'}`
                  }
                </p>
              </>
            )}
            
            <div className="mt-4 pt-4 border-t border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Need Help?</h4>
              <div className="space-y-2 text-sm text-blue-700">
                <p>• Contact the store at {storePhone || 'the number provided'}</p>
                <p>• Track your order status in your account</p>
                <p>• Save this confirmation for your records</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
