import { defineResource } from '@packages/schemas/core'
import {
  CreateStoreInputSchema,
  UpdateStoreInputSchema,
  StoreResponseSchema,
  StoreListResponseSchema,
  StoreQuerySchema,
} from '@packages/schemas/dtos'
import { StoreDomain, eventBus, DomainEvents, locationDomain } from '@packages/domain'
import { prisma, getAffiliateByReferralCode } from '@packages/db'
import { checkStoreActivationRequirements } from '@packages/db/services'
import { getStoreReadiness } from '../services/store-readiness.service.js'

// ========================================
// Store Resource Definition
// Uses centralized domain services
// ========================================

const storeDomain = new StoreDomain()

const BROWSE_KEYWORDS: Record<string, string[]> = {
  'meal-prep': ['meal prep', 'meal', 'catering', 'cater', 'prepared'],
  bakery: ['bakery', 'baked', 'bread', 'pastry', 'pastries', 'dessert', 'cake'],
  coffee: ['coffee', 'cafe', 'drink', 'drinks', 'tea'],
  specialty: ['specialty', 'artisan', 'gift', 'gifts', 'market'],
}

function textSearchFilter(terms: string[]): Record<string, unknown> | undefined {
  const cleanTerms = terms.map(term => term.trim()).filter(term => term.length >= 2)
  if (cleanTerms.length === 0) return undefined

  return {
    OR: cleanTerms.flatMap(term => [
      { name: { contains: term } },
      { description: { contains: term } },
      { companyName: { contains: term } },
      { addressCity: { contains: term } },
      { addressZip: { contains: term } },
    ]),
  }
}

function splitSearchTerms(query: unknown): string[] {
  if (typeof query !== 'string') return []
  const trimmed = query.trim()
  if (!trimmed) return []
  return [trimmed, ...trimmed.split(/\s+/).filter(term => term.length >= 2)]
}

function addAndFilter(target: Record<string, unknown>, filter: Record<string, unknown> | undefined) {
  if (!filter) return
  const existing = Array.isArray(target.AND) ? target.AND : []
  target.AND = [...existing, filter]
}

function dedupeStoresByArea<T extends { addressZip?: unknown; id?: unknown; name?: unknown }>(stores: T[]): T[] {
  const seen = new Set<string>()
  const deduped: T[] = []
  const sortedStores = [...stores].sort((a, b) => {
    const zipA = typeof a.addressZip === 'string' ? a.addressZip : ''
    const zipB = typeof b.addressZip === 'string' ? b.addressZip : ''
    const zipCompare = zipA.localeCompare(zipB)
    if (zipCompare !== 0) return zipCompare
    return String(a.name ?? '').localeCompare(String(b.name ?? ''))
  })

  for (const store of sortedStores) {
    const zip = typeof store.addressZip === 'string' ? store.addressZip.trim() : ''
    const key = zip || String(store.id ?? deduped.length)
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(store)
  }

  return deduped
}

export type CoordinateSearchStore = {
  id: string
  latitude?: unknown
  longitude?: unknown
  deliveryDistance?: unknown
  [key: string]: unknown
}

export function filterStoresForCoordinateSearch<T extends CoordinateSearchStore>(
  stores: T[],
  latitude: number,
  longitude: number,
  radiusMiles: number
): Array<T & { distance: number }> {
  return stores
    .map(store => {
      const storeLatitude = Number(store.latitude)
      const storeLongitude = Number(store.longitude)

      if (!locationDomain.isValidCoordinates(storeLatitude, storeLongitude)) {
        return null
      }

      const distance = locationDomain.calculateDistance(latitude, longitude, storeLatitude, storeLongitude)
      return { ...store, distance }
    })
    .filter((store): store is T & { distance: number } => {
      if (store === null) return false
      const withinSearchRadius = store.distance <= radiusMiles
      const storeDeliveryDistance = store.deliveryDistance ? Number(store.deliveryDistance) : null
      const withinDeliveryRadius = storeDeliveryDistance === null || store.distance <= storeDeliveryDistance
      return withinSearchRadius && withinDeliveryRadius
    })
    .sort((a, b) => a.distance - b.distance)
}

async function buildStoreListFilters(filters: Record<string, unknown>): Promise<Record<string, unknown>> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { latitude, longitude, radiusMiles, city, state, zip, q, browse, ...rest } = filters
  const prismaFilters: Record<string, unknown> = { ...rest }

  if (!prismaFilters.ownerUserId && !prismaFilters.status) {
    prismaFilters.status = 'ACTIVE'
  }
  if (!prismaFilters.ownerUserId && prismaFilters.isPublished === undefined) {
    prismaFilters.isPublished = true
  }
  if (typeof prismaFilters.isPublished === 'string') {
    prismaFilters.isPublished = prismaFilters.isPublished === 'true'
  }

  if (typeof city === 'string' && city.trim()) {
    addAndFilter(prismaFilters, { addressCity: { contains: city.trim() } })
    if (typeof state === 'string' && state.trim()) {
      addAndFilter(prismaFilters, { addressState: state.trim().toUpperCase() })
    }
  } else if (typeof zip === 'string' && zip.trim()) {
    addAndFilter(prismaFilters, { addressZip: zip.trim() })
  }

  addAndFilter(prismaFilters, textSearchFilter(splitSearchTerms(q)))

  if (typeof browse === 'string') {
    addAndFilter(prismaFilters, textSearchFilter(BROWSE_KEYWORDS[browse] ?? [browse]))
  }

  if (!prismaFilters.ownerUserId) {
    const storeList = await prisma.store.findMany({
      where: prismaFilters,
      select: { id: true },
    })

    const storeIds = storeList.map(store => store.id)
    const activationChecks = await Promise.all(
      storeIds.map(storeId => checkStoreActivationRequirements(storeId))
    )
    const eligibleStoreIds = activationChecks
      .map((check, index) => (check.canAppearInMarketplace ? storeIds[index] : null))
      .filter((id): id is string => id !== null)

    prismaFilters.id = {
      in: eligibleStoreIds.length > 0
        ? eligibleStoreIds
        : ['00000000-0000-0000-0000-000000000000'],
    }
  }

  return prismaFilters
}

/**
 * Phase 4A — resolve a store's affiliate attribution at create time.
 * Precedence:
 *  1. `affiliateReferralCode` provided in the request body (vendor-supplied; e.g.
 *     captured from /r/:slugOrCode and persisted in localStorage on the client).
 *     Must resolve to an ACTIVE affiliate.
 *  2. The creating user's snapshotted `User.referredByAffiliateId` (set at signup).
 *
 * Returns `{ affiliateId, referralCode, referralSlug }` or `null` when the store
 * has no attribution. Raw `referredByAffiliateId` is never trusted from the body.
 */
async function resolveStoreReferral(
  affiliateReferralCode: string | undefined,
  creatingUserId: string,
): Promise<{ affiliateId: string; referralCode: string; referralSlug: string | null } | null> {
  const code = affiliateReferralCode?.trim().toUpperCase()
  if (code) {
    const affiliate = await getAffiliateByReferralCode(code)
    if (affiliate && affiliate.status === 'ACTIVE') {
      return {
        affiliateId: affiliate.id,
        referralCode: affiliate.referralCode,
        referralSlug: affiliate.referralSlug ?? null,
      }
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: creatingUserId },
    select: {
      referredByAffiliateId: true,
      referredByAffiliate: { select: { referralCode: true, referralSlug: true, status: true } },
    },
  })

  if (
    user?.referredByAffiliateId &&
    user.referredByAffiliate &&
    user.referredByAffiliate.status === 'ACTIVE'
  ) {
    return {
      affiliateId: user.referredByAffiliateId,
      referralCode: user.referredByAffiliate.referralCode,
      referralSlug: user.referredByAffiliate.referralSlug ?? null,
    }
  }

  return null
}

export const storeResource = defineResource({
  name: 'store',
  model: 'Store',
  schemas: {
    create: CreateStoreInputSchema,
    update: UpdateStoreInputSchema,
    response: StoreResponseSchema,
    list: StoreListResponseSchema,
    query: StoreQuerySchema,
  },
  access: {
    create: ['USER', 'VENDOR', 'ADMIN'],  // Open vendor model: store creation converts USER -> VENDOR
    read: [],  // Public
    update: ['USER', 'VENDOR', 'ADMIN'],  // Ownership hook decides who can update
    delete: ['ADMIN'],  // Only admins can delete
    list: [],  // Public
  },
  ownership: {
    enabled: true,  // Enforce ownership: users can only update their own stores
    relationPath: 'ownerUserId',
  },
  operations: ['create', 'read', 'update', 'delete', 'list'],
  customHooks: {
    beforeCreate: async (data: any, context: any) => {
      if (!['USER', 'VENDOR', 'ADMIN'].includes(context.userRole)) {
        throw new Error('Authenticated users can create stores')
      }

      // Phase 4A — strip raw `referredByAffiliateId` (never trust the client) and
      // resolve attribution server-side from the supplied code (or fall back to
      // the creator's snapshotted referral).
      const { affiliateReferralCode, referredByAffiliateId: _ignored, ...rest } = data ?? {}
      const referral = await resolveStoreReferral(affiliateReferralCode, context.userId)

      const prepared = await storeDomain.prepareForCreation(rest, context.userId)
      return referral
        ? { ...prepared, referredByAffiliateId: referral.affiliateId }
        : prepared
    },
    beforeUpdate: async (id: string, data: any, context: any) => {
      // Enforce ownership: only store owner can update
      const store = await prisma.store.findUnique({
        where: { id },
        select: { ownerUserId: true },
      })
      
      if (!store || (context.userRole !== 'ADMIN' && store.ownerUserId !== context.userId)) {
        throw new Error('Only store owner can update store')
      }

      if (data.isPublished === true) {
        const readiness = await getStoreReadiness(id)
        if (!readiness?.canPublish) {
          throw new Error('Store is not ready to publish')
        }
      }
      
      return data
    },
    beforeDelete: async (id: string, context: any) => {
      // Enforce ownership: only store owner can delete
      const store = await prisma.store.findUnique({
        where: { id },
        select: { ownerUserId: true },
      })
      
      if (!store || (context.userRole !== 'ADMIN' && store.ownerUserId !== context.userId)) {
        throw new Error('Only store owner can delete store')
      }
      
    },
    afterCreate: async (result, context) => {
      if (context?.userId && context.userRole === 'USER') {
        await prisma.user.update({
          where: { id: context.userId },
          data: { role: 'VENDOR' },
        })
      }

      // Phase 4A step 7 — emit a STORE_SIGNUP referral event when the store is
      // attributed. Snapshot referralCode/referralSlug so the event is meaningful
      // even if the affiliate later rotates them.
      const created = result as { id: string; referredByAffiliateId?: string | null }
      if (created.referredByAffiliateId) {
        const affiliate = await prisma.affiliate.findUnique({
          where: { id: created.referredByAffiliateId },
          select: { referralCode: true, referralSlug: true },
        })
        await prisma.referralEvent.create({
          data: {
            affiliateId: created.referredByAffiliateId,
            eventType: 'STORE_SIGNUP',
            referredStoreId: created.id,
            referralCode: affiliate?.referralCode ?? null,
            referralSlug: affiliate?.referralSlug ?? null,
            metadata: { ownerUserId: context?.userId ?? null },
          },
        })
      }

      // Emit domain event
      await eventBus.emit(DomainEvents.STORE_CREATED, result)
    },
    beforeList: async (filters) => {
      return buildStoreListFilters(filters as Record<string, unknown>)
    },
    afterRead: async (result) => {
      // Include media assets for single store read
      const store = result as {
        id: string
        stripeAccountId?: string | null
        stripeOnboarded?: boolean | null
        stripeChargesEnabled?: boolean | null
      }
      const mediaAssets = await prisma.mediaAsset.findMany({
        where: { 
          storeId: store.id,
          kind: 'IMAGE' 
        },
        orderBy: { sortIndex: 'asc' }
      })
      const acceptsOnlineCardPayments = Boolean(
        store.stripeAccountId &&
          store.stripeOnboarded &&
          store.stripeChargesEnabled,
      )
      return {
        ...(result as Record<string, unknown>),
        mediaAssets,
        acceptsOnlineCardPayments,
      }
    },
    afterList: async (result, context) => {
      const listResult = result as { data: Array<{
        id: string
        latitude?: number | null
        longitude?: number | null
        [key: string]: unknown
      }>, total: number }
      
      // Extract location filters from query
      const filters = (context as unknown as { filters?: Record<string, unknown> })?.filters || {}
      const latitude = Number(filters.latitude)
      const longitude = Number(filters.longitude)
      const radiusMiles = Number(filters.radiusMiles) || 25
      const city = typeof filters.city === 'string' ? filters.city.trim() : ''
      const state = typeof filters.state === 'string' ? filters.state.trim() : ''
      const hookContext = context as unknown as {
        page?: number
        limit?: number
        orderBy?: Record<string, unknown>
      }
      
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude === 0 || longitude === 0) {
        if (city && state) {
          const page = Math.max(Number(hookContext.page) || 1, 1)
          const limit = Math.max(Number(hookContext.limit) || 20, 1)
          const prismaFilters = await buildStoreListFilters(filters)
          const cityStores = await prisma.store.findMany({
            where: prismaFilters,
            orderBy: hookContext.orderBy || { createdAt: 'desc' },
          })
          const dedupedStores = dedupeStoresByArea(cityStores)
          
          // Add media assets to each store
          const storesWithMedia = await Promise.all(
            dedupedStores.map(async (store) => {
              const mediaAssets = await prisma.mediaAsset.findMany({
                where: { 
                  storeId: store.id,
                  kind: 'IMAGE' 
                },
                orderBy: { sortIndex: 'asc' }
              })
              return { ...store, mediaAssets }
            })
          )
          
          const start = (page - 1) * limit

          return {
            data: storesWithMedia.slice(start, start + limit),
            total: storesWithMedia.length,
          }
        }

        return listResult
      }
      
      const page = Math.max(Number(hookContext.page) || 1, 1)
      const limit = Math.max(Number(hookContext.limit) || 20, 1)
      const prismaFilters = await buildStoreListFilters(filters)
      const candidateStores = await prisma.store.findMany({
        where: prismaFilters,
        orderBy: hookContext.orderBy || { createdAt: 'desc' },
      })
      const storesWithDistance = filterStoresForCoordinateSearch(
        candidateStores,
        latitude,
        longitude,
        radiusMiles
      )
      
      // Add media assets to each store
      const storesWithMedia = await Promise.all(
        storesWithDistance.map(async (store) => {
          const mediaAssets = await prisma.mediaAsset.findMany({
            where: { 
              storeId: store.id,
              kind: 'IMAGE' 
            },
            orderBy: { sortIndex: 'asc' }
          })
          return { ...store, mediaAssets }
        })
      )
      
      const start = (page - 1) * limit
      
      return {
        data: storesWithMedia.slice(start, start + limit),
        total: storesWithMedia.length,
      }
    },
  },
})
