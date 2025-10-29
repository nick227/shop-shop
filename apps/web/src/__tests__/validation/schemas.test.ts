/**
 * Comprehensive Schema Test Coverage
 * Tests all schemas to ensure they validate data correctly
 */

import { describe, it, expect } from 'vitest'
import { schemas } from './mocks/UnifiedSchemas'
import { z } from 'zod'

describe('Schemas', () => {
  describe('Store Schemas', () => {
    describe('StoreResponseSchema', () => {
      it('should validate valid store response', () => {
        const validStore = {
          id: 'store-123',
          name: 'Test Store',
          description: 'A test store',
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          phone: '555-1234',
          email: 'test@store.com',
          isActive: true,
          deliveryFee: 5.99,
          minimumOrder: 10,
          commissionRate: 0.05,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          ownerId: 'user-123'
        }

        const result = schemas.store.safeParse(validStore)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validStore)
        }
      })

      it('should reject store with missing required fields', () => {
        const invalidStore = {
          id: 'store-123',
          name: 'Test Store'
          // Missing required fields
        }

        const result = schemas.store.safeParse(invalidStore)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0)
          expect(result.error.issues[0].code).toBe('invalid_type')
        }
      })

      it('should reject store with invalid email', () => {
        const invalidStore = {
          id: 'store-123',
          name: 'Test Store',
          description: 'A test store',
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          phone: '555-1234',
          email: 'invalid-email', // Invalid email
          isActive: true,
          deliveryFee: 5.99,
          minimumOrder: 10,
          commissionRate: 0.05,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          ownerId: 'user-123'
        }

        const result = schemas.store.safeParse(invalidStore)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].code).toBe('invalid_string')
        }
      })
    })

    describe('CreateStoreInputSchema', () => {
      it('should validate valid create store input', () => {
        const validInput = {
          name: 'New Store',
          description: 'A new store',
          address: '456 New St',
          city: 'New City',
          state: 'NS',
          postalCode: '54321',
          phone: '555-5678',
          email: 'new@store.com',
          deliveryFee: 3.99,
          minimumOrder: 15,
          commissionRate: 0.03
        }

        const result = schemas.createStore.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validInput)
        }
      })

      it('should reject create store input with negative delivery fee', () => {
        const invalidInput = {
          name: 'New Store',
          description: 'A new store',
          address: '456 New St',
          city: 'New City',
          state: 'NS',
          postalCode: '54321',
          phone: '555-5678',
          email: 'new@store.com',
          deliveryFee: -3.99, // Invalid: negative fee
          minimumOrder: 15,
          commissionRate: 0.03
        }

        const result = schemas.createStore.safeParse(invalidInput)
        expect(result.success).toBe(false)
      })
    })

    describe('UpdateStoreInputSchema', () => {
      it('should validate valid update store input', () => {
        const validInput = {
          name: 'Updated Store',
          description: 'An updated store'
        }

        const result = schemas.updateStore.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validInput)
        }
      })

      it('should validate empty update store input', () => {
        const emptyInput = {}

        const result = schemas.updateStore.safeParse(emptyInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(emptyInput)
        }
      })
    })
  })

  describe('Item Schemas', () => {
    describe('ItemResponseSchema', () => {
      it('should validate valid item response', () => {
        const validItem = {
          id: 'item-123',
          name: 'Test Item',
          description: 'A test item',
          price: 9.99,
          stockQty: 100,
          isActive: true,
          storeId: 'store-123',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }

        const result = schemas.item.safeParse(validItem)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validItem)
        }
      })

      it('should reject item with negative price', () => {
        const invalidItem = {
          id: 'item-123',
          name: 'Test Item',
          description: 'A test item',
          price: -9.99, // Invalid: negative price
          stockQty: 100,
          isActive: true,
          storeId: 'store-123',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }

        const result = schemas.item.safeParse(invalidItem)
        expect(result.success).toBe(false)
      })

      it('should reject item with negative stock quantity', () => {
        const invalidItem = {
          id: 'item-123',
          name: 'Test Item',
          description: 'A test item',
          price: 9.99,
          stockQty: -10, // Invalid: negative stock
          isActive: true,
          storeId: 'store-123',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }

        const result = schemas.item.safeParse(invalidItem)
        expect(result.success).toBe(false)
      })
    })

    describe('CreateItemInputSchema', () => {
      it('should validate valid create item input', () => {
        const validInput = {
          name: 'New Item',
          description: 'A new item',
          price: 12.99,
          stockQty: 50,
          storeId: 'store-123'
        }

        const result = schemas.createItem.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validInput)
        }
      })
    })

    describe('UpdateItemInputSchema', () => {
      it('should validate valid update item input', () => {
        const validInput = {
          name: 'Updated Item',
          price: 15.99
        }

        const result = schemas.updateItem.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validInput)
        }
      })
    })
  })

  describe('Order Schemas', () => {
    describe('OrderResponseSchema', () => {
      it('should validate valid order response', () => {
        const validOrder = {
          id: 'order-123',
          userId: 'user-123',
          storeId: 'store-123',
          status: 'PENDING',
          subtotal: 19.98,
          tax: 1.6,
          deliveryFee: 5.99,
          total: 27.57,
          deliveryType: 'DELIVERY',
          addressSnapshot: {
            line1: '123 Test St',
            line2: 'Apt 1',
            city: 'Test City',
            state: 'TS',
            postalCode: '12345'
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }

        const result = schemas.order.safeParse(validOrder)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validOrder)
        }
      })

      it('should reject order with invalid status', () => {
        const invalidOrder = {
          id: 'order-123',
          userId: 'user-123',
          storeId: 'store-123',
          status: 'INVALID_STATUS', // Invalid status
          subtotal: 19.98,
          tax: 1.6,
          deliveryFee: 5.99,
          total: 27.57,
          deliveryType: 'DELIVERY',
          addressSnapshot: {
            line1: '123 Test St',
            city: 'Test City',
            state: 'TS',
            postalCode: '12345'
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }

        const result = schemas.order.safeParse(invalidOrder)
        expect(result.success).toBe(false)
      })
    })

    describe('CreateOrderInputSchema', () => {
      it('should validate valid create order input', () => {
        const validInput = {
          storeId: 'store-123',
          deliveryType: 'DELIVERY',
          addressId: 'address-123',
          items: [
            {
              itemId: 'item-123',
              quantity: 2,
              unitPrice: 9.99
            }
          ]
        }

        const result = schemas.createOrder.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validInput)
        }
      })
    })
  })

  describe('Cart Schemas', () => {
    describe('CartResponseSchema', () => {
      it('should validate valid cart response', () => {
        const validCart = {
          id: 'cart-123',
          userId: 'user-123',
          storeId: 'store-123',
          items: [
            {
              id: 'cart-item-123',
              itemId: 'item-123',
              quantity: 2,
              unitPrice: 9.99,
              totalPrice: 19.98
            }
          ],
          subtotal: 19.98,
          tax: 1.6,
          deliveryFee: 5.99,
          total: 27.57,
          status: 'ACTIVE',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }

        const result = schemas.cart.safeParse(validCart)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validCart)
        }
      })
    })

    describe('AddToCartInputSchema', () => {
      it('should validate valid add to cart input', () => {
        const validInput = {
          itemId: 'item-123',
          quantity: 2
        }

        const result = schemas.addCartItem.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validInput)
        }
      })

      it('should reject add to cart with zero quantity', () => {
        const invalidInput = {
          itemId: 'item-123',
          quantity: 0 // Invalid: zero quantity
        }

        const result = schemas.addCartItem.safeParse(invalidInput)
        expect(result.success).toBe(false)
      })
    })

    describe('UpdateCartInputSchema', () => {
      it('should validate valid update cart input', () => {
        const validInput = {
          quantity: 3
        }

        const result = schemas.updateCartItem.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validInput)
        }
      })
    })
  })

  describe('Address Schemas', () => {
    describe('AddressResponseSchema', () => {
      it('should validate valid address response', () => {
        const validAddress = {
          id: 'address-123',
          userId: 'user-123',
          line1: '123 Test St',
          line2: 'Apt 1',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'US',
          isDefault: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }

        const result = schemas.address.safeParse(validAddress)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validAddress)
        }
      })

      it('should reject address with invalid postal code', () => {
        const invalidAddress = {
          id: 'address-123',
          userId: 'user-123',
          line1: '123 Test St',
          city: 'Test City',
          state: 'TS',
          postalCode: 'invalid', // Invalid postal code
          country: 'US',
          isDefault: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }

        const result = schemas.address.safeParse(invalidAddress)
        expect(result.success).toBe(false)
      })
    })

    describe('CreateAddressInputSchema', () => {
      it('should validate valid create address input', () => {
        const validInput = {
          line1: '456 New St',
          line2: 'Suite 2',
          city: 'New City',
          state: 'NS',
          postalCode: '54321',
          country: 'US',
          isDefault: false
        }

        const result = schemas.createAddress.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validInput)
        }
      })
    })

    describe('UpdateAddressInputSchema', () => {
      it('should validate valid update address input', () => {
        const validInput = {
          line1: 'Updated Address',
          city: 'Updated City'
        }

        const result = schemas.updateAddress.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validInput)
        }
      })
    })
  })

  describe('Bundle Schemas', () => {
    describe('BundleResponseSchema', () => {
      it('should validate valid bundle response', () => {
        const validBundle = {
          id: 'bundle-123',
          name: 'Test Bundle',
          description: 'A test bundle',
          isActive: true,
          sortIndex: 1,
          pricing: {
            type: 'FIXED_PRICE',
            value: 29.99
          },
          items: [
            {
              itemId: 'item-123',
              quantity: 2,
              sortIndex: 1
            }
          ],
          storeId: 'store-123',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }

        const result = schemas.bundle.safeParse(validBundle)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validBundle)
        }
      })

      it('should reject bundle with invalid pricing type', () => {
        const invalidBundle = {
          id: 'bundle-123',
          name: 'Test Bundle',
          description: 'A test bundle',
          isActive: true,
          sortIndex: 1,
          pricing: {
            type: 'INVALID_TYPE', // Invalid pricing type
            value: 29.99
          },
          items: [
            {
              itemId: 'item-123',
              quantity: 2,
              sortIndex: 1
            }
          ],
          storeId: 'store-123',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }

        const result = schemas.bundle.safeParse(invalidBundle)
        expect(result.success).toBe(false)
      })
    })

    describe('CreateBundleInputSchema', () => {
      it('should validate valid create bundle input', () => {
        const validInput = {
          name: 'New Bundle',
          description: 'A new bundle',
          pricing: {
            type: 'DISCOUNT_PERCENT',
            value: 10
          },
          items: [
            {
              itemId: 'item-123',
              quantity: 1
            }
          ],
          storeId: 'store-123'
        }

        const result = schemas.createBundle.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validInput)
        }
      })
    })

    describe('UpdateBundleInputSchema', () => {
      it('should validate valid update bundle input', () => {
        const validInput = {
          name: 'Updated Bundle',
          isActive: false
        }

        const result = schemas.updateBundle.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validInput)
        }
      })
    })
  })

  describe('User Schemas', () => {
    describe('UserPublicResponseSchema', () => {
      it('should validate valid user response', () => {
        const validUser = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          phone: '555-1234',
          role: 'USER',
          isCompany: false,
          companyName: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }

        const result = schemas.user.safeParse(validUser)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validUser)
        }
      })

      it('should reject user with invalid email', () => {
        const invalidUser = {
          id: 'user-123',
          email: 'invalid-email', // Invalid email
          name: 'Test User',
          phone: '555-1234',
          role: 'USER',
          isCompany: false,
          companyName: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }

        const result = schemas.user.safeParse(invalidUser)
        expect(result.success).toBe(false)
      })

      it('should reject user with invalid role', () => {
        const invalidUser = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          phone: '555-1234',
          role: 'INVALID_ROLE', // Invalid role
          isCompany: false,
          companyName: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }

        const result = schemas.user.safeParse(invalidUser)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('Auth Schemas', () => {
    describe('LoginInputSchema', () => {
      it('should validate valid login input', () => {
        const validInput = {
          email: 'test@example.com',
          password: 'password123'
        }

        const result = schemas.login.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validInput)
        }
      })

      it('should reject login with invalid email', () => {
        const invalidInput = {
          email: 'invalid-email',
          password: 'password123'
        }

        const result = schemas.login.safeParse(invalidInput)
        expect(result.success).toBe(false)
      })

      it('should reject login with empty password', () => {
        const invalidInput = {
          email: 'test@example.com',
          password: ''
        }

        const result = schemas.login.safeParse(invalidInput)
        expect(result.success).toBe(false)
      })
    })

    describe('SignupInputSchema', () => {
      it('should validate valid signup input', () => {
        const validInput = {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        }

        const result = schemas.signup.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validInput)
        }
      })

      it('should reject signup with weak password', () => {
        const invalidInput = {
          email: 'test@example.com',
          password: '123', // Too short
          name: 'Test User'
        }

        const result = schemas.signup.safeParse(invalidInput)
        expect(result.success).toBe(false)
      })
    })

    describe('AuthResponseSchema', () => {
      it('should validate valid auth response', () => {
        const validResponse = {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'USER'
          },
          token: 'jwt-token-123'
        }

        const result = schemas.authResponse.safeParse(validResponse)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validResponse)
        }
      })
    })
  })

  describe('Payment Schemas', () => {
    describe('PaymentIntentResponseSchema', () => {
      it('should validate valid payment intent response', () => {
        const validResponse = {
          id: 'pi_123',
          amount: 2799, // $27.99 in cents
          currency: 'usd',
          status: 'requires_payment_method',
          clientSecret: 'pi_123_secret',
          createdAt: '2024-01-01T00:00:00Z'
        }

        const result = schemas.paymentIntent.safeParse(validResponse)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validResponse)
        }
      })

      it('should reject payment intent with negative amount', () => {
        const invalidResponse = {
          id: 'pi_123',
          amount: -100, // Invalid: negative amount
          currency: 'usd',
          status: 'requires_payment_method',
          clientSecret: 'pi_123_secret',
          createdAt: '2024-01-01T00:00:00Z'
        }

        const result = schemas.paymentIntent.safeParse(invalidResponse)
        expect(result.success).toBe(false)
      })
    })

    describe('CreatePaymentIntentInputSchema', () => {
      it('should validate valid create payment intent input', () => {
        const validInput = {
          amount: 2799,
          currency: 'usd',
          orderId: 'order-123'
        }

        const result = schemas.createPaymentIntent.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validInput)
        }
      })
    })
  })

  describe('Tip Schemas', () => {
    describe('TipResponseSchema', () => {
      it('should validate valid tip response', () => {
        const validTip = {
          id: 'tip-123',
          orderId: 'order-123',
          amount: 5,
          status: 'PENDING',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }

        const result = schemas.tip.safeParse(validTip)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validTip)
        }
      })

      it('should reject tip with negative amount', () => {
        const invalidTip = {
          id: 'tip-123',
          orderId: 'order-123',
          amount: -5, // Invalid: negative amount
          status: 'PENDING',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }

        const result = schemas.tip.safeParse(invalidTip)
        expect(result.success).toBe(false)
      })
    })

    describe('CreateTipInputSchema', () => {
      it('should validate valid create tip input', () => {
        const validInput = {
          orderId: 'order-123',
          amount: 5
        }

        const result = schemas.createTip.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validInput)
        }
      })
    })

    describe('UpdateTipInputSchema', () => {
      it('should validate valid update tip input', () => {
        const validInput = {
          amount: 10,
          status: 'COMPLETED'
        }

        const result = schemas.updateTip.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validInput)
        }
      })
    })
  })

  describe('Media Schemas', () => {
    describe('MediaResponseSchema', () => {
      it('should validate valid media response', () => {
        const validMedia = {
          id: 'media-123',
          url: 'https://example.com/image.jpg',
          filename: 'image.jpg',
          mimeType: 'image/jpeg',
          size: 1_024_000,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }

        const result = schemas.mediaUpload.safeParse(validMedia)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validMedia)
        }
      })

      it('should reject media with invalid URL', () => {
        const invalidMedia = {
          id: 'media-123',
          url: 'not-a-url', // Invalid URL
          filename: 'image.jpg',
          mimeType: 'image/jpeg',
          size: 1_024_000,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }

        const result = schemas.mediaUpload.safeParse(invalidMedia)
        expect(result.success).toBe(false)
      })
    })

    describe('UploadMediaInputSchema', () => {
      it('should validate valid upload media input', () => {
        const validInput = {
          filename: 'image.jpg',
          mimeType: 'image/jpeg',
          size: 1_024_000
        }

        const result = schemas.mediaUploadMetadata.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validInput)
        }
      })
    })
  })

  describe('Post & Comment Schemas (River Features)', () => {
    describe('PostResponseSchema', () => {
      it('should validate valid post response', () => {
        const validPost = {
          id: 'post-123',
          storeId: 'store-123',
          content: 'This is a test post',
          mediaUrls: ['https://example.com/image1.jpg'],
          likesCount: 5,
          commentsCount: 2,
          sharesCount: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }

        const result = schemas.post.safeParse(validPost)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validPost)
        }
      })
    })

    describe('CommentResponseSchema', () => {
      it('should validate valid comment response', () => {
        const validComment = {
          id: 'comment-123',
          postId: 'post-123',
          userId: 'user-123',
          content: 'This is a test comment',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }

        const result = schemas.comment.safeParse(validComment)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validComment)
        }
      })
    })
  })

  describe('Promotion Schemas', () => {
    describe('PromotionResponseSchema', () => {
      it('should validate valid promotion response', () => {
        const validPromotion = {
          id: 'promo-123',
          name: 'Test Promotion',
          description: 'A test promotion',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          isActive: true,
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-12-31T23:59:59Z',
          storeId: 'store-123',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }

        const result = schemas.promotion.safeParse(validPromotion)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validPromotion)
        }
      })
    })

    describe('CreatePromotionInputSchema', () => {
      it('should validate valid create promotion input', () => {
        const validInput = {
          name: 'New Promotion',
          description: 'A new promotion',
          discountType: 'FIXED_AMOUNT',
          discountValue: 5,
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-12-31T23:59:59Z',
          storeId: 'store-123'
        }

        const result = schemas.createPromotion.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validInput)
        }
      })
    })

    describe('UpdatePromotionInputSchema', () => {
      it('should validate valid update promotion input', () => {
        const validInput = {
          name: 'Updated Promotion',
          isActive: false
        }

        const result = schemas.updatePromotion.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validInput)
        }
      })
    })
  })
})
