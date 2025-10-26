import { defineResource } from '@packages/schemas/core'
import {
  CreateAddressInputSchema,
  UpdateAddressInputSchema,
  AddressResponseSchema,
  AddressListResponseSchema,
} from '@packages/schemas/dtos'
import { prisma } from '@packages/db'

/**
 * Address Resource Definition
 * Manages user delivery addresses
 */
export const addressResource = defineResource({
  name: 'address',
  model: 'address',
  schemas: {
    create: CreateAddressInputSchema,
    update: UpdateAddressInputSchema,
    response: AddressResponseSchema,
    list: AddressListResponseSchema,
  },
  access: {
    create: ['USER', 'VENDOR', 'ADMIN'],
    read: ['USER', 'VENDOR', 'ADMIN'],
    update: ['USER', 'VENDOR', 'ADMIN'],
    delete: ['USER', 'VENDOR', 'ADMIN'],
    list: ['USER', 'VENDOR', 'ADMIN'],
  },
  ownership: {
    enabled: true,
    relationPath: 'userId', // Users can only manage their own addresses
  },
  operations: ['create', 'read', 'update', 'delete', 'list'],
  customHooks: {
    beforeCreate: async (data, context) => {
      const input = data as {
        label?: string
        contactName?: string
        phone?: string
        line1: string
        line2?: string
        city: string
        state: string
        postalCode: string
        country?: string
        instructions?: string
        isDefault?: boolean
      }

      // If this is set as default, unset other defaults
      if (input.isDefault) {
        await prisma.address.updateMany({
          where: {
            userId: context!.userId!,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        })
      }

      return {
        ...input,
        userId: context!.userId!,
        country: input.country || 'US',
        isDefault: input.isDefault ?? false,
        isActive: true,
      }
    },

    beforeUpdate: async (id, data, context) => {
      const input = data as {
        isDefault?: boolean
      }

      // If setting as default, unset other defaults
      if (input.isDefault === true) {
        await prisma.address.updateMany({
          where: {
            userId: context!.userId!,
            isDefault: true,
            id: { not: id as string },
          },
          data: {
            isDefault: false,
          },
        })
      }

      return data
    },

    beforeDelete: async (id) => {
      // Soft delete - set isActive to false and archivedAt
      await prisma.address.update({
        where: { id: id as string },
        data: {
          isActive: false,
          archivedAt: new Date(),
        },
      })

      // Prevent actual deletion by throwing after soft delete
      throw new Error('Address archived successfully')
    },

    beforeList: async (_filters, context) => {
      // Only return user's own active addresses
      return {
        userId: context!.userId!,
        isActive: true,
      }
    },
  },
})

