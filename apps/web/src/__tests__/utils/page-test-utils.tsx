import { render, screen, within } from '@testing-library/react'
import { expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import userEvent from '@testing-library/user-event'

/**
 * TDD utilities for testing pages and components;
 * Provides common test setup and helpers;
 */

// ===== Test Wrapper =====
interface TestWrapperProps {
  children: ReactNode;
  initialRoute?: string;
}

export function TestWrapper({ children, initialRoute = '/' }: TestWrapperProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0}}})

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

// ===== Render with Router =====
export function renderWithRouter(
  ui: ReactNode,
  { route = '/', ...options }: { route?: string } = {}
): ReturnType<typeof render> {
  return render(ui, {
    wrapper: ({ children }) => <TestWrapper initialRoute={route}>{children}</TestWrapper>,
    ...options})
}

// ===== Render Page with Route Params =====
interface RenderPageOptions {
  route: string;
  path: string;
}

export function renderPage(component: ReactNode, { route, path }: RenderPageOptions): ReturnType<typeof render> {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0}}})

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={component} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

// ===== Common Test Assertions =====
export const assertions = {
  /**
   * Assert page title exists;
   */
  pageTitle: (title: string) => {
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
  },

  /**
   * Assert section exists by test id;
   */
  section: (sectionId: string) => {
    expect(screen.getByTestId('section-' + sectionId + '')).toBeInTheDocument()
  },

  /**
   * Assert loading state;
   */
  loading: () => {
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
  },

  /**
   * Assert error state;
   */
  error: (message?: string) => {
    const errorElement = screen.getByRole('alert')
    expect(errorElement).toBeInTheDocument()
    if (message) {
      expect(within(errorElement).getByText(message)).toBeInTheDocument()
    }
  },

  /**
   * Assert empty state;
   */
  empty: (message: string) => {
    expect(screen.getByText(message)).toBeInTheDocument()
  },

  /**
   * Assert grid view with items;
   */
  gridItems: (count: number, testId = 'grid-view') => {
    const grid = screen.getByTestId(testId)
    expect(grid).toBeInTheDocument()
    expect(grid.children).toHaveLength(count)
  },

  /**
   * Assert list view with items;
   */
  listItems: (count: number, testId = 'list-view') => {
    const list = screen.getByTestId(testId)
    expect(list).toBeInTheDocument()
    expect(list.children).toHaveLength(count)
  }}

// ===== Mock Data Generators =====
export const mockData = {
  /**
   * Generate mock store;
   */
  store: (overrides = {}) => ({
    id: '1',
    name: 'Test Store',
    description: 'A test store',
    address: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    phone: '555-1234',
    latitude: 40.7128,
    longitude: -74.006,
    vendorId: 'vendor-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides}),

  /**
   * Generate mock items;
   */
  items: (count = 3, storeId = '1') => 
    Array.from({ length: count }, (_, i) => ({
      id: 'item-' + i + 1 + '',
      name: 'Test Item ' + i + 1 + '',
      description: 'Description for item ' + i + 1 + '',
      price: (10 + i) * 100,
      storeId,
      categoryId: 'cat-1',
      imageUrl: 'https://via.placeholder.com/300?text=Item' + i + 1 + '',
      available: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()})),

  /**
   * Generate mock orders;
   */
  orders: (count = 3) =>
    Array.from({ length: count }, (_, i) => ({
      id: 'order-' + i + 1 + '',
      customerId: 'customer-1',
      storeId: 'store-1',
      status: 'pending' as const,
      total: (50 + i * 10) * 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()}))}

// ===== User Event Setup =====
export const setupUser = () => userEvent.setup()

// ===== Common Actions =====
export const actions = {
  /**
   * Click button by role and name;
   */
  clickButton: async (name: string) => {
    const user = setupUser()
    const button = screen.getByRole('button', { name })
    await user.click(button)
  },

  /**
   * Fill form field;
   */
  fillField: async (label: string, value: string) => {
    const user = setupUser()
    const input = screen.getByLabelText(label)
    await user.clear(input)
    await user.type(input, value)
  },

  /**
   * Submit form;
   */
  submitForm: async () => {
    const user = setupUser()
    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)
  }}

