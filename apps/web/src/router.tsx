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
const StoreDetailPage = lazy(() => import('./pages/shared/StoreDetail.page'))
const ItemDetailPage = lazy(() => import('./pages/shared/ItemDetail.page'))
const CartPage = lazy(() => import('./pages/shared/Cart.page'))
const CheckoutPage = lazy(() => import('./pages/shared/Checkout.page'))
const OrderHistoryPage = lazy(() => import('./pages/customer/Orders.page'))
const OrderTrackingPage = lazy(() => import('./pages/customer/OrderTracking.page'))

// Vendor pages;
const VendorDashboardPage = lazy(() => import('./pages/vendor/Dashboard.page'))
const StoreFormPage = lazy(() => import('./pages/vendor/StoreForm.page'))
const StoreItemsPage = lazy(() => import('./pages/vendor/StoreItems.page'))
const ItemFormPage = lazy(() => import('./pages/vendor/ItemForm.page'))
const VendorOrdersPage = lazy(() => import('./pages/vendor/Orders.page'))
const VendorStoreRiverPage = lazy(() => import('./pages/vendor/Bundles.page'))

// Customer account pages;
const CustomerDashboardPage = lazy(() => import('./pages/customer/Dashboard.page'))
const CustomerProfilePage = lazy(() => import('./pages/customer/Profile.page'))
const CustomerDeliveriesPage = lazy(() => import('./pages/customer/Deliveries.page'))
const CustomerAddressesPage = lazy(() => import('./pages/customer/Addresses.page'))

// River (social feed)
const StoreRiverPage = lazy(() => import('./pages/shared/StoreDetail.page'))

// Error pages;
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const ErrorPage = lazy(() => import('./pages/ErrorPage'))

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: lazyRoute(ErrorPage),
    children: [
      // Auth routes;
      {
        path: '/login',
        element: lazyRoute(LoginPage)},
      {
        path: '/signup',
        element: lazyRoute(SignupPage)},
      // Protected routes;
      {
        path: '/',
        element: (
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        )},
      {
        path: '/store/:id',
        element: (
          <ProtectedRoute>
            {lazyRoute(StoreDetailPage)}
          </ProtectedRoute>
        )},
      {
        path: '/stores/:storeId',
        element: (
          <ProtectedRoute>
            {lazyRoute(StoreDetailPage)}
          </ProtectedRoute>
        )},
      {
        path: '/stores/:storeId/items/:itemId',
        element: (
          <ProtectedRoute>
            {lazyRoute(ItemDetailPage)}
          </ProtectedRoute>
        )},
      {
        path: '/items/:itemSlug',
        element: (
          <ProtectedRoute>
            {lazyRoute(ItemDetailPage)}
          </ProtectedRoute>
        )},
      {
        path: '/cart',
        element: (
          <ProtectedRoute>
            {lazyRoute(CartPage)}
          </ProtectedRoute>
        )},
      {
        path: '/checkout',
        element: (
          <ProtectedRoute>
            {lazyRoute(CheckoutPage)}
          </ProtectedRoute>
        )},
      {
        path: '/order/:id',
        element: (
          <ProtectedRoute>
            {lazyRoute(OrderTrackingPage)}
          </ProtectedRoute>
        )},
      {
        path: '/orders/:orderId',
        element: (
          <ProtectedRoute>
            {lazyRoute(OrderTrackingPage)}
          </ProtectedRoute>
        )},
      {
        path: '/orders',
        element: (
          <ProtectedRoute>
            {lazyRoute(OrderHistoryPage)}
          </ProtectedRoute>
        )},
      {
        path: '/river/:storeId?',
        element: (
          <ProtectedRoute>
            {lazyRoute(StoreRiverPage)}
          </ProtectedRoute>
        )},
      // Vendor routes (wrapped in VendorLayout)
      // Open platform: any authenticated user can access vendor portal;
      {
        path: '/vendor',
        element: (
          <ProtectedRoute>
            <VendorLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            path: 'dashboard',
            element: lazyRoute(VendorDashboardPage)},
          {
            path: 'stores/new',
            element: lazyRoute(StoreFormPage)},
          {
            path: 'stores/:storeId/edit',
            element: lazyRoute(StoreFormPage)},
          {
            path: 'stores/:storeId/items',
            element: lazyRoute(StoreItemsPage)},
          {
            path: 'stores/:storeId/items/new',
            element: lazyRoute(ItemFormPage)},
          {
            path: 'stores/:storeId/items/:itemId/edit',
            element: lazyRoute(ItemFormPage)},
          {
            path: 'stores/:storeId/river',
            element: lazyRoute(VendorStoreRiverPage)},
          {
            path: 'orders',
            element: lazyRoute(VendorOrdersPage)},
        ]},
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
            element: <Navigate to="/account/dashboard" replace />},
          {
            path: 'dashboard',
            element: lazyRoute(CustomerDashboardPage)},
          {
            path: 'orders',
            element: lazyRoute(OrderHistoryPage)},
          {
            path: 'deliveries',
            element: lazyRoute(CustomerDeliveriesPage)},
          {
            path: 'profile',
            element: lazyRoute(CustomerProfilePage)},
          {
            path: 'addresses',
            element: lazyRoute(CustomerAddressesPage)},
        ]},
      {
        path: '*',
        element: lazyRoute(NotFoundPage)},
    ]},
], {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true}})

