/**
 * MSW Request Handlers - Mock API responses;
 */
/* eslint-disable unicorn/no-null */
import { http, HttpResponse } from 'msw'
import type { AuthResponse, StoreListResponse } from '@packages/schemas'

// Use same env var as the app (stubbed in setup.ts)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3005'

export const handlers = [
  http.post('' + API_BASE + '/auth/login', (): HttpResponse<AuthResponse> => {
    return HttpResponse.json({
      user: {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        phone: null,
        isCompany: false,
        companyName: null,
        createdAt: new Date().toISOString()
      },
      token: 'mock-jwt-token'
    })
  }),

  http.post('' + API_BASE + '/auth/signup', (): HttpResponse<AuthResponse> => {
    return HttpResponse.json({
      user: {
        id: '124',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'USER',
        phone: null,
        isCompany: false,
        companyName: null,
        createdAt: new Date().toISOString()
      },
      token: 'mock-jwt-token-new'
    })
  }),

  http.get('' + API_BASE + '/stores', (): HttpResponse<StoreListResponse> => {
    return HttpResponse.json({
      data: [
        {
          owner: 'user-123',
          name: 'Test Restaurant',
          slug: 'test-Store',
          description: 'A great place to eat',
          companyName: null,
          taxId: null,
          phone: '555-1234',
          email: 'test@restaurant.com',
          website: 'https://testrestaurant.com',
          isPublished: true,
          deliveryEnabled: true,
          pickupEnabled: true,
          prepTimeMin: 30,
          feesJson: null,
          hoursJson: null,
          deliveryDistance: null,
          deliveryCharge: null,
          deliveryZones: '[]',
          latitude: null,
          longitude: null,
          addressStreet: null,
          addressCity: null,
          addressState: null,
          addressZip: null,
          addressCountry: null,
          geocodedAt: null,
          geocodeSource: null,
          referredByAffiliateId: null,
          referredByAffiliate: null,
          stripeAccountId: null,
          stripeOnboarded: null,
          commissionRate: null,
          media: '[]',
          items: '[]',
          orders: '[]',
          carts: '[]',
          posts: '[]',
          bundles: '[]',
          teamMembers: '[]',
          invitations: '[]',
          Promotion: '[]',
          FavoriteStore: '[]'
        }
      ],
      total: 1,
      page: 1,
      limit: 20})
  }),
]

