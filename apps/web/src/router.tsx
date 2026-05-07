/**
 * Router Configuration - Route definitions;
 */
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from './layouts/MainLayout'
import { VendorLayout } from './layouts/VendorLayout'
import { CustomerLayout } from './layouts/CustomerLayout'
import { ProtectedRoute, lazyRoute } from './router/utils'

// Lazy load pages for code splitting;
import { lazy } from 'react'

const LoginPage = lazy(() => import('./pages/public/Login.page'))
const SignupPage = lazy(() => import('./pages/public/Signup.page'))
// Temporarily disable lazy loading for HomePage to fix render2 error;
import HomePage from './pages/public/Home.page'
const SearchPage = lazy(() => import('./pages/search/Search.page'))
const UnifiedSearchPage = lazy(() => import('./pages/search/UnifiedSearch.page'))
const StoreDetailPage = lazy(() => import('./pages/shared/StoreDetail.page'))
const ItemDetailPage = lazy(() => import('./pages/shared/ItemDetail.page'))
const CartPage = lazy(() => import('./pages/shared/Cart.page'))
const CheckoutPage = lazy(() => import('./pages/shared/Checkout.page'))
const OrderHistoryPage = lazy(() => import('./pages/customer/Orders.page'))
const OrderTrackingPage = lazy(() => import('./pages/customer/OrderTracking.page'))

// Vendor pages;
const VendorDashboardPage = lazy(() => import('./pages/vendor/Dashboard.page'))
const VendorStoreOnboardingPage = lazy(() => import('./pages/vendor/StoreOnboarding.page'))
const StoreFormPage = lazy(() => import('./pages/vendor/StoreForm.page'))
const StoreItemsPage = lazy(() => import('./pages/vendor/StoreItems.page'))
const ItemFormPage = lazy(() => import('./pages/vendor/ItemForm.page'))
const StoreBundlesPage = lazy(() => import('./pages/vendor/StoreBundles.page'))
const StoreBundleEditorPage = lazy(() => import('./pages/vendor/StoreBundleEditor.page'))
const VendorOrdersPage = lazy(() => import('./pages/vendor/Orders.page'))
const VendorStoreRiverPage = lazy(() => import('./pages/vendor/Bundles.page'))
const VendorTeamPage = lazy(() => import('./pages/vendor/Team.page'))
const VendorDriversPage = lazy(() => import('./pages/vendor/Drivers.page'))
import VendorTeamStoreRedirectPage from './pages/vendor/VendorTeamStoreRedirect.page'

// Customer account pages;
const CustomerDashboardPage = lazy(() => import('./pages/customer/Dashboard.page'))
const CustomerProfilePage = lazy(() => import('./pages/customer/Profile.page'))
const CustomerDeliveriesPage = lazy(() => import('./pages/customer/Deliveries.page'))
const CustomerAddressesPage = lazy(() => import('./pages/customer/Addresses.page'))

// Driver pages
const DriverDeliveriesPage = lazy(() => import('./pages/driver/Deliveries.page'))

// River (social feed)
const StoreRiverPage = lazy(() => import('./pages/shared/StoreDetail.page'))

// Error pages;
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const ErrorPage = lazy(() => import('./pages/ErrorPage'))

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter(
  [
    {
      element: <Layout />,
      errorElement: lazyRoute(ErrorPage),
      children: [
        // Auth routes;
        {
          path: '/login',
          element: lazyRoute(LoginPage),
          handle: { title: 'Login' },
        },
        {
          path: '/signup',
          element: lazyRoute(SignupPage),
          handle: { title: 'Sign Up' },
        },
        // Vendor application routes;
        {
          path: '/vendor/apply',
          element: <Navigate to="/vendor/store/new" replace />,
        },
        {
          path: '/vendor/application-status',
          element: <Navigate to="/vendor/dashboard" replace />,
        },
        // Public shopping routes;
        {
          path: '/',
          element: <HomePage />,
          handle: { title: 'Home' },
        },
        {
          path: '/search',
          element: lazyRoute(UnifiedSearchPage),
          handle: { title: 'Search' },
        },
        {
          path: '/kitchen/:slug',
          element: lazyRoute(StoreDetailPage),
        },
        {
          path: '/items/:itemId',
          element: lazyRoute(ItemDetailPage),
        },
        {
          path: '/cart',
          element: lazyRoute(CartPage),
          handle: { title: 'Cart' },
        },
        {
          path: '/checkout',
          element: lazyRoute(CheckoutPage),
          handle: { title: 'Checkout' },
        },
        {
          path: '/orders/:id',
          element: lazyRoute(OrderTrackingPage),
        },
        {
          path: '/orders',
          element: <ProtectedRoute>{lazyRoute(OrderHistoryPage)}</ProtectedRoute>,
          handle: { title: 'Orders' },
        },
        {
          path: '/driver/deliveries',
          element: <ProtectedRoute>{lazyRoute(DriverDeliveriesPage)}</ProtectedRoute>,
          handle: { title: 'Driver Deliveries' },
        },
        {
          path: '/river/:storeId?',
          element: <ProtectedRoute>{lazyRoute(StoreRiverPage)}</ProtectedRoute>,
          handle: { title: 'River' },
        },
        // Vendor routes (wrapped in VendorLayout)
        // Open vendor model: any authenticated user can create or manage their stores.
        {
          path: '/vendor',
          element: (
            <ProtectedRoute>
              <VendorLayout />
            </ProtectedRoute>
          ),
          children: [
            {
              index: true,
              element: <Navigate to="/vendor/dashboard" replace />,
            },
            {
              path: 'dashboard',
              element: lazyRoute(VendorDashboardPage),
              handle: { title: 'Vendor Dashboard' },
            },
            {
              path: 'onboarding/store',
              element: lazyRoute(VendorStoreOnboardingPage),
              handle: { title: 'Store Onboarding' },
            },
            {
              path: 'stores/new',
              element: lazyRoute(StoreFormPage),
              handle: { title: 'New Store' },
            },
            {
              path: 'store/new',
              element: lazyRoute(StoreFormPage),
              handle: { title: 'New Store' },
            },
            {
              path: 'stores/:storeId/edit',
              element: lazyRoute(StoreFormPage),
              handle: { title: 'Edit Store' },
            },
            {
              path: 'stores/:storeId/items',
              element: lazyRoute(StoreItemsPage),
              handle: { title: 'Store Items' },
            },
            {
              path: 'stores/:storeId/items/new',
              element: lazyRoute(ItemFormPage),
              handle: { title: 'New Item' },
            },
            {
              path: 'stores/:storeId/items/:itemId/edit',
              element: lazyRoute(ItemFormPage),
              handle: { title: 'Edit Item' },
            },
            {
              path: 'stores/:storeId/bundles',
              element: lazyRoute(StoreBundlesPage),
              handle: { title: 'Store Bundles' },
            },
            {
              path: 'stores/:storeId/bundles/new',
              element: lazyRoute(StoreBundleEditorPage),
              handle: { title: 'Create Bundle' },
            },
            {
              path: 'stores/:storeId/bundles/:bundleId/edit',
              element: lazyRoute(StoreBundleEditorPage),
              handle: { title: 'Edit Bundle' },
            },
            {
              path: 'stores/:storeId/river',
              element: lazyRoute(VendorStoreRiverPage),
              handle: { title: 'Store River' },
            },
            {
              path: 'orders',
              element: lazyRoute(VendorOrdersPage),
              handle: { title: 'Vendor Orders' },
            },
            {
              path: 'team',
              element: lazyRoute(VendorTeamPage),
              handle: { title: 'Team' },
            },
            {
              path: 'drivers',
              element: lazyRoute(VendorDriversPage),
              handle: { title: 'Drivers' },
            },
            {
              path: 'stores/:storeId/team',
              element: <VendorTeamStoreRedirectPage />,
              handle: { title: 'Team' },
            },
          ],
        },
        // Customer account routes (wrapped in CustomerLayout)
        {
          path: '/account',
          element: (
            <ProtectedRoute>
              <CustomerLayout />
            </ProtectedRoute>
          ),
          children: [
            {
              index: true,
              element: <Navigate to="/account/dashboard" replace />,
            },
            {
              path: 'dashboard',
              element: lazyRoute(CustomerDashboardPage),
              handle: { title: 'Dashboard' },
            },
            {
              path: 'orders',
              element: lazyRoute(OrderHistoryPage),
              handle: { title: 'Orders' },
            },
            {
              path: 'deliveries',
              element: lazyRoute(CustomerDeliveriesPage),
              handle: { title: 'Deliveries' },
            },
            {
              path: 'profile',
              element: lazyRoute(CustomerProfilePage),
              handle: { title: 'Profile' },
            },
            {
              path: 'addresses',
              element: lazyRoute(CustomerAddressesPage),
              handle: { title: 'Addresses' },
            },
          ],
        },
        {
          path: '*',
          element: lazyRoute(NotFoundPage),
          handle: { title: 'Not Found' },
        },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  }
)
