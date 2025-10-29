/**
 * Comprehensive Validation Test Coverage
 * Tests all validators to ensure they work correctly with valid and invalid data
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { validators, validationUtils, ValidationError } from './mocks/validators'
import { z } from 'zod'

describe('Validators', () => {
  describe('Store Validators', () => {
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

    it('should validate valid store data', () => {
      expect(() => validators.store(validStore)).not.toThrow()
      const result = validators.store(validStore)
      expect(result).toEqual(validStore)
    })

    it('should validate valid store list', () => {
      const storeList = [validStore, { ...validStore, id: 'store-456' }]
      expect(() => validators.storeList(storeList)).not.toThrow()
      const result = validators.storeList(storeList)
      expect(result).toHaveLength(2)
    })

    it('should reject invalid store data', () => {
      const invalidStore = { ...validStore, name: '' } // Empty name should fail
      expect(() => validators.store(invalidStore)).toThrow(ValidationError)
    })

    it('should reject store with missing required fields', () => {
      const incompleteStore = { id: 'store-123' } // Missing required fields
      expect(() => validators.store(incompleteStore)).toThrow(ValidationError)
    })
  })

  describe('Item Validators', () => {
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

    it('should validate valid item data', () => {
      expect(() => validators.item(validItem)).not.toThrow()
      const result = validators.item(validItem)
      expect(result).toEqual(validItem)
    })

    it('should validate valid item list', () => {
      const itemList = [validItem, { ...validItem, id: 'item-456' }]
      expect(() => validators.itemList(itemList)).not.toThrow()
      const result = validators.itemList(itemList)
      expect(result).toHaveLength(2)
    })

    it('should reject item with invalid price', () => {
      const invalidItem = { ...validItem, price: -5.99 } // Negative price should fail
      expect(() => validators.item(invalidItem)).toThrow(ValidationError)
    })

    it('should reject item with invalid stock quantity', () => {
      const invalidItem = { ...validItem, stockQty: -10 } // Negative stock should fail
      expect(() => validators.item(invalidItem)).toThrow(ValidationError)
    })
  })

  describe('Cart Validators', () => {
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

    it('should validate valid cart data', () => {
      expect(() => validators.cart(validCart)).not.toThrow()
      const result = validators.cart(validCart)
      expect(result).toEqual(validCart)
    })

    it('should validate valid cart list', () => {
      const cartList = [validCart, { ...validCart, id: 'cart-456' }]
      expect(() => validators.cartList(cartList)).not.toThrow()
      const result = validators.cartList(cartList)
      expect(result).toHaveLength(2)
    })

    it('should reject cart with invalid total calculation', () => {
      const invalidCart = { ...validCart, total: 0 } // Total should match calculation
      expect(() => validators.cart(invalidCart)).toThrow(ValidationError)
    })
  })

  describe('Order Validators', () => {
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

    it('should validate valid order data', () => {
      expect(() => validators.order(validOrder)).not.toThrow()
      const result = validators.order(validOrder)
      expect(result).toEqual(validOrder)
    })

    it('should validate valid order list', () => {
      const orderList = [validOrder, { ...validOrder, id: 'order-456' }]
      expect(() => validators.orderList(orderList)).not.toThrow()
      const result = validators.orderList(orderList)
      expect(result).toHaveLength(2)
    })

    it('should reject order with invalid status', () => {
      const invalidOrder = { ...validOrder, status: 'INVALID_STATUS' }
      expect(() => validators.order(invalidOrder)).toThrow(ValidationError)
    })
  })

  describe('Address Validators', () => {
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

    it('should validate valid address data', () => {
      expect(() => validators.address(validAddress)).not.toThrow()
      const result = validators.address(validAddress)
      expect(result).toEqual(validAddress)
    })

    it('should validate valid address list', () => {
      const addressList = [validAddress, { ...validAddress, id: 'address-456' }]
      expect(() => validators.addressList(addressList)).not.toThrow()
      const result = validators.addressList(addressList)
      expect(result).toHaveLength(2)
    })

    it('should reject address with invalid postal code', () => {
      const invalidAddress = { ...validAddress, postalCode: 'invalid' }
      expect(() => validators.address(invalidAddress)).toThrow(ValidationError)
    })
  })

  describe('Bundle Validators', () => {
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

    it('should validate valid bundle data', () => {
      expect(() => validators.bundle(validBundle)).not.toThrow()
      const result = validators.bundle(validBundle)
      expect(result).toEqual(validBundle)
    })

    it('should validate valid bundle list', () => {
      const bundleList = [validBundle, { ...validBundle, id: 'bundle-456' }]
      expect(() => validators.bundleList(bundleList)).not.toThrow()
      const result = validators.bundleList(bundleList)
      expect(result).toHaveLength(2)
    })

    it('should reject bundle with invalid pricing type', () => {
      const invalidBundle = { 
        ...validBundle, 
        pricing: { type: 'INVALID_TYPE', value: 29.99 }
      }
      expect(() => validators.bundle(invalidBundle)).toThrow(ValidationError)
    })
  })

  describe('User Validators', () => {
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

    it('should validate valid user data', () => {
      expect(() => validators.user(validUser)).not.toThrow()
      const result = validators.user(validUser)
      expect(result).toEqual(validUser)
    })

    it('should validate valid user list', () => {
      const userList = [validUser, { ...validUser, id: 'user-456' }]
      expect(() => validators.userList(userList)).not.toThrow()
      const result = validators.userList(userList)
      expect(result).toHaveLength(2)
    })

    it('should reject user with invalid email', () => {
      const invalidUser = { ...validUser, email: 'invalid-email' }
      expect(() => validators.user(invalidUser)).toThrow(ValidationError)
    })

    it('should reject user with invalid role', () => {
      const invalidUser = { ...validUser, role: 'INVALID_ROLE' }
      expect(() => validators.user(invalidUser)).toThrow(ValidationError)
    })
  })

  describe('Auth Validators', () => {
    const validLogin = {
      email: 'test@example.com',
      password: 'password123'
    }

    const validSignup = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    }

    const validAuthResponse = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER'
      },
      token: 'jwt-token-123'
    }

    it('should validate valid login data', () => {
      expect(() => validators.login(validLogin)).not.toThrow()
      const result = validators.login(validLogin)
      expect(result).toEqual(validLogin)
    })

    it('should validate valid signup data', () => {
      expect(() => validators.signup(validSignup)).not.toThrow()
      const result = validators.signup(validSignup)
      expect(result).toEqual(validSignup)
    })

    it('should validate valid auth response', () => {
      expect(() => validators.auth(validAuthResponse)).not.toThrow()
      const result = validators.auth(validAuthResponse)
      expect(result).toEqual(validAuthResponse)
    })

    it('should reject login with invalid email', () => {
      const invalidLogin = { ...validLogin, email: 'invalid-email' }
      expect(() => validators.login(invalidLogin)).toThrow(ValidationError)
    })

    it('should reject signup with weak password', () => {
      const invalidSignup = { ...validSignup, password: '123' } // Too short
      expect(() => validators.signup(invalidSignup)).toThrow(ValidationError)
    })
  })

  describe('Payment Validators', () => {
    const validPaymentIntent = {
      id: 'pi_123',
      amount: 2799, // $27.99 in cents
      currency: 'usd',
      status: 'requires_payment_method',
      clientSecret: 'pi_123_secret',
      createdAt: '2024-01-01T00:00:00Z'
    }

    const validCreatePaymentIntent = {
      amount: 2799,
      currency: 'usd',
      orderId: 'order-123'
    }

    it('should validate valid payment intent', () => {
      expect(() => validators.paymentIntent(validPaymentIntent)).not.toThrow()
      const result = validators.paymentIntent(validPaymentIntent)
      expect(result).toEqual(validPaymentIntent)
    })

    it('should validate valid create payment intent', () => {
      expect(() => validators.createPaymentIntent(validCreatePaymentIntent)).not.toThrow()
      const result = validators.createPaymentIntent(validCreatePaymentIntent)
      expect(result).toEqual(validCreatePaymentIntent)
    })

    it('should reject payment intent with invalid amount', () => {
      const invalidPaymentIntent = { ...validPaymentIntent, amount: -100 }
      expect(() => validators.paymentIntent(invalidPaymentIntent)).toThrow(ValidationError)
    })
  })

  describe('Tip Validators', () => {
    const validTip = {
      id: 'tip-123',
      orderId: 'order-123',
      amount: 5,
      status: 'PENDING',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }

    const validCreateTip = {
      orderId: 'order-123',
      amount: 5
    }

    const validUpdateTip = {
      amount: 10,
      status: 'COMPLETED'
    }

    it('should validate valid tip data', () => {
      expect(() => validators.tip(validTip)).not.toThrow()
      const result = validators.tip(validTip)
      expect(result).toEqual(validTip)
    })

    it('should validate valid create tip', () => {
      expect(() => validators.createTip(validCreateTip)).not.toThrow()
      const result = validators.createTip(validCreateTip)
      expect(result).toEqual(validCreateTip)
    })

    it('should validate valid update tip', () => {
      expect(() => validators.updateTip(validUpdateTip)).not.toThrow()
      const result = validators.updateTip(validUpdateTip)
      expect(result).toEqual(validUpdateTip)
    })

    it('should reject tip with negative amount', () => {
      const invalidTip = { ...validTip, amount: -5 }
      expect(() => validators.tip(invalidTip)).toThrow(ValidationError)
    })
  })

  describe('Media Validators', () => {
    const validMediaUpload = {
      id: 'media-123',
      url: 'https://example.com/image.jpg',
      filename: 'image.jpg',
      mimeType: 'image/jpeg',
      size: 1_024_000,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }

    const validMediaUploadMetadata = {
      filename: 'image.jpg',
      mimeType: 'image/jpeg',
      size: 1_024_000
    }

    it('should validate valid media upload', () => {
      expect(() => validators.mediaUpload(validMediaUpload)).not.toThrow()
      const result = validators.mediaUpload(validMediaUpload)
      expect(result).toEqual(validMediaUpload)
    })

    it('should validate valid media upload metadata', () => {
      expect(() => validators.mediaUploadMetadata(validMediaUploadMetadata)).not.toThrow()
      const result = validators.mediaUploadMetadata(validMediaUploadMetadata)
      expect(result).toEqual(validMediaUploadMetadata)
    })

    it('should reject media upload with invalid URL', () => {
      const invalidMediaUpload = { ...validMediaUpload, url: 'not-a-url' }
      expect(() => validators.mediaUpload(invalidMediaUpload)).toThrow(ValidationError)
    })
  })

  describe('Post & Comment Validators (River Features)', () => {
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

    const validComment = {
      id: 'comment-123',
      postId: 'post-123',
      userId: 'user-123',
      content: 'This is a test comment',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }

    it('should validate valid post data', () => {
      expect(() => validators.post(validPost)).not.toThrow()
      const result = validators.post(validPost)
      expect(result).toEqual(validPost)
    })

    it('should validate valid comment data', () => {
      expect(() => validators.comment(validComment)).not.toThrow()
      const result = validators.comment(validComment)
      expect(result).toEqual(validComment)
    })

    it('should validate valid post list', () => {
      const postList = [validPost, { ...validPost, id: 'post-456' }]
      expect(() => validators.postList(postList)).not.toThrow()
      const result = validators.postList(postList)
      expect(result).toHaveLength(2)
    })

    it('should validate valid comment list', () => {
      const commentList = [validComment, { ...validComment, id: 'comment-456' }]
      expect(() => validators.commentList(commentList)).not.toThrow()
      const result = validators.commentList(commentList)
      expect(result).toHaveLength(2)
    })
  })

  describe('Input Validators', () => {
    const validCreateStore = {
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

    const validUpdateStore = {
      name: 'Updated Store',
      description: 'An updated store'
    }

    it('should validate valid create store input', () => {
      expect(() => validators.createStore(validCreateStore)).not.toThrow()
      const result = validators.createStore(validCreateStore)
      expect(result).toEqual(validCreateStore)
    })

    it('should validate valid update store input', () => {
      expect(() => validators.updateStore(validUpdateStore)).not.toThrow()
      const result = validators.updateStore(validUpdateStore)
      expect(result).toEqual(validUpdateStore)
    })

    it('should reject create store with missing required fields', () => {
      const invalidCreateStore = { name: 'Store' } // Missing required fields
      expect(() => validators.createStore(invalidCreateStore)).toThrow(ValidationError)
    })
  })
})

describe('Validation Utilities', () => {
  describe('isValidationError', () => {
    it('should identify validation errors', () => {
      const validationError = new ValidationError('Test error', 'testField', [])
      expect(validationUtils.isValidationError(validationError)).toBe(true)
    })

    it('should reject non-validation errors', () => {
      const regularError = new Error('Regular error')
      expect(validationUtils.isValidationError(regularError)).toBe(false)
    })
  })

  describe('getValidationDetails', () => {
    it('should extract validation details', () => {
      const errors = [
        { path: ['field1'], message: 'Field 1 error', code: 'invalid_type' },
        { path: ['field2'], message: 'Field 2 error', code: 'too_small' }
      ]
      const validationError = new ValidationError('Test error', 'testField', errors as any)
      const details = validationUtils.getValidationDetails(validationError)
      
      expect(details.field).toBe('testField')
      expect(details.errors).toHaveLength(2)
      expect(details.errors[0].path).toBe('field1')
      expect(details.errors[0].message).toBe('Field 1 error')
    })
  })

  describe('formatValidationError', () => {
    it('should format validation error for display', () => {
      const errors = [
        { path: ['field1'], message: 'Field 1 error', code: 'invalid_type' },
        { path: ['field2'], message: 'Field 2 error', code: 'too_small' }
      ]
      const validationError = new ValidationError('Test error', 'testField', errors as any)
      const formatted = validationUtils.formatValidationError(validationError)
      
      expect(formatted).toContain('testField validation failed')
      expect(formatted).toContain('field1: Field 1 error')
      expect(formatted).toContain('field2: Field 2 error')
    })
  })

  describe('validateData', () => {
    it('should return success for valid data', () => {
      const result = validationUtils.validateData(validators.store, {
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
      })
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Test Store')
      }
    })

    it('should return error for invalid data', () => {
      const result = validationUtils.validateData(validators.store, {
        id: 'store-123',
        name: '', // Invalid: empty name
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
      })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError)
      }
    })
  })

  describe('validateMultiple', () => {
    it('should validate multiple valid items', () => {
      const validStores = [
        {
          id: 'store-1',
          name: 'Store 1',
          description: 'Store 1 description',
          address: '123 St',
          city: 'City',
          state: 'ST',
          postalCode: '12345',
          phone: '555-0001',
          email: 'store1@test.com',
          isActive: true,
          deliveryFee: 5.99,
          minimumOrder: 10,
          commissionRate: 0.05,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          ownerId: 'user-1'
        },
        {
          id: 'store-2',
          name: 'Store 2',
          description: 'Store 2 description',
          address: '456 St',
          city: 'City',
          state: 'ST',
          postalCode: '54321',
          phone: '555-0002',
          email: 'store2@test.com',
          isActive: true,
          deliveryFee: 3.99,
          minimumOrder: 15,
          commissionRate: 0.03,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          ownerId: 'user-2'
        }
      ]

      const result = validationUtils.validateMultiple(validators.store, validStores)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(2)
      }
    })

    it('should return errors for invalid items', () => {
      const mixedStores = [
        {
          id: 'store-1',
          name: 'Valid Store',
          description: 'Valid description',
          address: '123 St',
          city: 'City',
          state: 'ST',
          postalCode: '12345',
          phone: '555-0001',
          email: 'store1@test.com',
          isActive: true,
          deliveryFee: 5.99,
          minimumOrder: 10,
          commissionRate: 0.05,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          ownerId: 'user-1'
        },
        {
          id: 'store-2',
          name: '', // Invalid: empty name
          description: 'Invalid description',
          address: '456 St',
          city: 'City',
          state: 'ST',
          postalCode: '54321',
          phone: '555-0002',
          email: 'store2@test.com',
          isActive: true,
          deliveryFee: 3.99,
          minimumOrder: 15,
          commissionRate: 0.03,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          ownerId: 'user-2'
        }
      ]

      const result = validationUtils.validateMultiple(validators.store, mixedStores)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0]).toBeInstanceOf(ValidationError)
      }
    })
  })

  describe('createSafeValidator', () => {
    it('should create a safe validator that returns results', () => {
      const safeStoreValidator = validationUtils.createSafeValidator(validators.store)
      
      const validData = {
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

      const result = safeStoreValidator(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should return error result for invalid data', () => {
      const safeStoreValidator = validationUtils.createSafeValidator(validators.store)
      
      const invalidData = { name: '' } // Missing required fields
      const result = safeStoreValidator(invalidData)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError)
      }
    })
  })
})
