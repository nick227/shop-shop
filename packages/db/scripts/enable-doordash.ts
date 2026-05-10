import { prisma } from '../src/client.js'
import { randomUUID } from 'crypto'

async function enableDoorDashForStore() {
  try {
    console.log('🔧 Enabling DoorDash for test store...')
    
    // Find a test store (Bakery Bliss North Central)
    const store = await prisma.store.findFirst({
      where: { 
        name: { contains: 'Bakery Bliss' }
      }
    })
    
    if (!store) {
      console.error('❌ Store not found')
      return
    }
    
    console.log(`📍 Found store: ${store.name} (${store.id})`)
    
    // Add DoorDash delivery option using Prisma client
    const deliveryOption = await prisma.storeDeliveryOption.upsert({
      where: {
        storeId_deliveryMode: {
          storeId: store.id,
          deliveryMode: 'DOORDASH_DRIVE'
        }
      },
      update: {
        enabled: true,
        feeDisclosure: '$5.99 delivery fee',
        externalInfoUrl: 'https://www.doordash.com',
        sortOrder: 2
      },
      create: {
        id: randomUUID(),
        storeId: store.id,
        deliveryMode: 'DOORDASH_DRIVE',
        enabled: true,
        feeDisclosure: '$5.99 delivery fee',
        externalInfoUrl: 'https://www.doordash.com',
        sortOrder: 2
      }
    })
    
    console.log('✅ Added DoorDash delivery option:', deliveryOption.id)
    
    // Add DoorDash provider config using Prisma client
    const providerConfig = await prisma.storeDeliveryProviderConfig.upsert({
      where: {
        storeId_provider: {
          storeId: store.id,
          provider: 'DOORDASH_DRIVE'
        }
      },
      update: {
        enabled: true,
        settingsJson: {
          maxDeliveryRadiusMiles: 10,
          minDeliveryOrderCents: 1000,
          deliveryInstructions: 'Leave at door',
          pickupContactName: 'Bakery Bliss Manager',
          pickupContactPhone: '555-0123'
        }
      },
      create: {
        id: randomUUID(),
        storeId: store.id,
        provider: 'DOORDASH_DRIVE',
        enabled: true,
        settingsJson: {
          maxDeliveryRadiusMiles: 10,
          minDeliveryOrderCents: 1000,
          deliveryInstructions: 'Leave at door',
          pickupContactName: 'Bakery Bliss Manager',
          pickupContactPhone: '555-0123'
        }
      }
    })
    
    console.log('✅ Added DoorDash provider config:', providerConfig.id)
    
    // Verify the setup using Prisma client
    const verification = await prisma.storeDeliveryOption.findMany({
      where: { storeId: store.id },
      include: {
        store: {
          select: { name: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })
    
    console.log('\n📋 Verification results:')
    console.table(verification.map(opt => ({
      store_name: opt.store.name,
      delivery_mode: opt.deliveryMode,
      enabled: opt.enabled,
      fee_disclosure: opt.feeDisclosure,
      external_info_url: opt.externalInfoUrl,
      sort_order: opt.sortOrder
    })))
    
    console.log('\n🎉 DoorDash successfully enabled for store!')
    
  } catch (error) {
    console.error('❌ Error enabling DoorDash:', error)
  } finally {
    await prisma.$disconnect()
  }
}

enableDoorDashForStore()
