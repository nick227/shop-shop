/**
 * Test Setup for Type System Tests;
 * Configures mocks, globals, and test environment;
 */

import { vi } from 'vitest'

// Mock React;
vi.mock('react', () => ({
  ...vi.importActual('react'),
  useState: vi.fn(),
  useEffect: vi.fn(),
  useCallback: vi.fn(),
  useMemo: vi.fn(),
  useRef: vi.fn(),
  useReducer: vi.fn(),
  useContext: vi.fn(),
  createContext: vi.fn(),
  forwardRef: vi.fn(),
  memo: vi.fn(),
  lazy: vi.fn(),
  Suspense: vi.fn(),
  Fragment: vi.fn()
}))

// Mock React Query;
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
  QueryClient: vi.fn(),
  QueryClientProvider: vi.fn()
}))

// Mock React Router;
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  useParams: vi.fn(),
  useLocation: vi.fn(),
  Link: vi.fn(),
  NavLink: vi.fn(),
  Outlet: vi.fn(),
  Routes: vi.fn(),
  Route: vi.fn(),
  BrowserRouter: vi.fn(),
  HashRouter: vi.fn(),
  MemoryRouter: vi.fn()
}))

// Mock API Client;
vi.mock('@api/client', () => ({
  apiClient: {
    stores: vi.fn(() => ({
      getStoreById: vi.fn(),
      createStore: vi.fn(),
      updateStore: vi.fn(),
      deleteStore: vi.fn()
    })),
    items: vi.fn(() => ({
      getItemById: vi.fn(),
      createItem: vi.fn(),
      updateItem: vi.fn(),
      deleteItem: vi.fn()
    })),
    orders: vi.fn(() => ({
      getOrderById: vi.fn(),
      createOrder: vi.fn(),
      updateOrder: vi.fn(),
      deleteOrder: vi.fn()
    }))
  }
}))

// Global test utilities;
declare global {
  var testUtils: {
    createMockStore: (overrides?: any) => any;
    createMockItem: (overrides?: any) => any;
    createMockOrder: (overrides?: any) => any;
  }
}

global.testUtils = {
  createMockStore: (overrides = {}) => ({
    id: 'store-1',
    name: 'Test Store',
    slug: 'test-store',
    description: 'A test store',
    companyName: 'Test Company',
    taxId: 'TAX123',
    phone: '555-1234',
    email: 'test@store.com',
    website: 'https://teststore.com',
    isPublished: true,
    deliveryEnabled: true,
    pickupEnabled: true,
    prepTimeMin: 30,
    deliveryDistance: '5',
    deliveryCharge: '2.50',
    addressStreet: '123 Main St',
    addressCity: 'Test City',
    addressState: 'TS',
    addressZip: '12345',
    addressCountry: 'US',
    latitude: '40.7128',
    longitude: '-74.0060',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),
  
  createMockItem: (overrides = {}) => ({
    id: 'item-1',
    title: 'Test Item',
    description: 'A test item',
    price: '9.99',
    category: 'Electronics',
    isActive: true,
    prepTimeMin: 15,
    storeId: 'store-1',
    sortIndex: 1,
    stockQty: 10,
    isSoldOut: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),
  
  createMockOrder: (overrides = {}) => ({
    id: 'order-1',
    cartId: 'cart-1',
    deliveryType: 'DELIVERY',
    addressId: 'address-1',
    tip: '3.00',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  })
}

// Console configuration;
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}
