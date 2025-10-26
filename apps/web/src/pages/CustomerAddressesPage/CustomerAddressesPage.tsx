/**
 * CustomerAddressesPage - Manage saved addresses;
 */

import { Button, Card } from '@ui'

export default function CustomerAddressesPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <header className="max-w-4xl mx-auto mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Addresses</h1>
          <p className="text-gray-600">Manage your saved delivery addresses</p>
        </div>
        <Button variant="primary">
          + Add Address;
        </Button>
      </header>

      <Card className="max-w-4xl mx-auto flex flex-col items-center justify-center p-12 text-center">
        <span className="text-6xl mb-4">📍</span>
        <h3 className="text-xl font-bold mb-2">No saved addresses</h3>
        <p className="text-gray-600 mb-6">
          Add delivery addresses for faster checkout;
        </p>
        <Button variant="primary">
          + Add Your First Address;
        </Button>
      </Card>
    </div>
  )
}
