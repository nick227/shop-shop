/**
 * NotFoundPage - 404 Error Page;
 */
import { Link, useLocation } from 'react-router-dom'

export default function NotFoundPage() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-orange-500">404</h1>
          <h2 className="mt-4 text-3xl font-semibold text-gray-900">
            Page Not Found
          </h2>
          <p className="mt-4 text-gray-600">
            The page <code className="px-2 py-1 bg-gray-200 rounded text-sm">{location.pathname}</code> doesn't exist.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 transition-colors"
          >
            Go to Home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Go Back
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need help? Check out these links:
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/" className="text-orange-500 hover:text-orange-600">
              Browse Stores;
            </Link>
            <Link to="/cart" className="text-orange-500 hover:text-orange-600">
              View Cart;
            </Link>
            <Link to="/orders" className="text-orange-500 hover:text-orange-600">
              Order History;
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

