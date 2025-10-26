import type { User, Store, Item } from '../generated/client/index.js'

// Mock User fixtures
export const mockUsers = {
  user: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'user@example.com',
    passwordHash: '$2b$12$hashedpassword',
    name: 'Test User',
    role: 'USER' as const,
    phone: null,
    isCompany: false,
    companyName: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as User,
  
  vendor: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'vendor@example.com',
    passwordHash: '$2b$12$hashedpassword',
    name: 'Test Vendor',
    role: 'VENDOR' as const,
    phone: '555-0100',
    isCompany: true,
    companyName: 'Test Company',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as User,
  
  admin: {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'admin@example.com',
    passwordHash: '$2b$12$hashedpassword',
    name: 'Test Admin',
    role: 'ADMIN' as const,
    phone: null,
    isCompany: false,
    companyName: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as User,
}

// Mock Store fixtures
export const mockStores = {
  active: {
    id: '00000000-0000-0000-0000-000000000101',
    ownerUserId: mockUsers.vendor.id,
    name: 'Test Store',
    slug: 'test-store',
    description: 'A test store',
    isPublished: true,
    deliveryEnabled: true,
    pickupEnabled: true,
    prepTimeMin: 15,
    feesJson: null,
    hoursJson: null,
    stripeAccountId: null,
    stripeOnboarded: false,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as Store,
  
  draft: {
    id: '00000000-0000-0000-0000-000000000102',
    ownerUserId: mockUsers.vendor.id,
    name: 'Draft Store',
    slug: 'draft-store',
    description: null,
    isPublished: false,
    deliveryEnabled: true,
    pickupEnabled: false,
    prepTimeMin: 20,
    feesJson: null,
    hoursJson: null,
    stripeAccountId: null,
    stripeOnboarded: false,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as Store,
}

// Mock Item fixtures
export const mockItems = {
  pizza: {
    id: '00000000-0000-0000-0000-000000000201',
    storeId: mockStores.active.id,
    title: 'Margherita Pizza',
    description: 'Classic tomato and mozzarella',
    price: '12.99',
    isActive: true,
    isSoldOut: false,
    sortIndex: 0,
    optionsJson: null,
    stockQty: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as unknown as Item,
  
  soldOut: {
    id: '00000000-0000-0000-0000-000000000202',
    storeId: mockStores.active.id,
    title: 'Special Pasta',
    description: 'Today\'s special',
    price: '15.99',
    isActive: true,
    isSoldOut: true,
    sortIndex: 1,
    optionsJson: null,
    stockQty: 0,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as unknown as Item,
}

// Helper to create new mock with overrides
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  ...mockUsers.user,
  ...overrides,
})

export const createMockStore = (overrides: Partial<Store> = {}): Store => ({
  ...mockStores.active,
  ...overrides,
})

export const createMockItem = (overrides: Partial<Item> = {}): Item => ({
  ...mockItems.pizza,
  ...overrides,
} as Item)

