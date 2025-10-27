/**
 * MSW Request Handlers - Mock API responses;
 */
import { http, HttpResponse } from 'msw'

// Use same env var as the app (stubbed in setup.ts)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3005'

export const handlers = [
  // Auth - Login;
  http.post('' + API_BASE + '/auth/login', async () => {
    return HttpResponse.json({
      user: {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        phone: undefined,
        isCompany: false,
        companyName: undefined,
        createdAt: new Date().toISOString()},
      token: 'mock-jwt-token'})
  }),

  // Auth - Signup;
  http.post('' + API_BASE + '/auth/signup', async () => {
    return HttpResponse.json({
      user: {
        id: '124',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'USER',
        phone: undefined,
        isCompany: false,
        companyName: undefined,
        createdAt: new Date().toISOString()},
      token: 'mock-jwt-token-new'})
  }),

  // Stores - List;
  http.get('' + API_BASE + '/stores', async () => {
    return HttpResponse.json({
      data: [
        {
          id: 'store-1',
          name: 'Test Restaurant',
          slug: 'test-Store',
          description: 'A great place to eat',
          isPublished: true,
          deliveryEnabled: true,
          pickupEnabled: true,
          prepTimeMin: 30,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()},
      ],
      total: 1,
      page: 1,
      limit: 20})
  }),
]

