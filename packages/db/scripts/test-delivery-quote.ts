import { prisma } from '../src/client.js'
import { randomUUID } from 'crypto'

async function testDeliveryQuote() {
  try {
    console.log('🚀 Testing DoorDash delivery quote...')
    
    // Find the test store with DoorDash enabled
    const store = await prisma.store.findFirst({
      where: { 
        name: { contains: 'Bakery Bliss' }
      },
      select: {
        id: true,
        name: true,
        addressStreet: true,
        addressCity: true,
        addressState: true,
        addressZip: true,
        latitude: true,
        longitude: true,
        phone: true
      }
    })
    
    if (!store) {
      console.error('❌ Store not found')
      return
    }
    
    console.log(`📍 Found store: ${store.name} (${store.id})`)
    console.log(`📍 Store address: ${store.addressStreet}, ${store.addressCity}, ${store.addressState} ${store.addressZip}`)
    console.log(`📍 Store location: ${store.latitude}, ${store.longitude}`)
    
    // Create a test order ID (without creating the actual order for now)
    const testOrderId = randomUUID()
    console.log(`📝 Using test order ID: ${testOrderId}`)
    
    // Test customer address (nearby location)
    const customerAddress = {
      line1: '123 Test Street',
      city: 'Austin',
      state: 'TX',
      postalCode: '78758',
      latitude: 30.3764,
      longitude: -97.7078
    }
    
    // Test the delivery quote using the mock adapter
    const { getDeliveryProviderAdapter } = await import('../src/services/delivery-provider.registry.js')
    
    console.log('🔍 Getting DoorDash adapter...')
    const adapter = getDeliveryProviderAdapter('DOORDASH_DRIVE')
    
    console.log('💰 Requesting delivery quote...')
    const quote = await adapter.quoteDelivery({
      orderId: testOrderId,
      storeId: store.id,
      dropoffLatitude: customerAddress.latitude,
      dropoffLongitude: customerAddress.longitude
    })
    
    console.log('✅ Quote received:')
    console.log(`   Fee: $${quote.feeCents / 100}`)
    console.log(`   Currency: ${quote.currency}`)
    console.log(`   ETA: ${quote.etaMinutes || 'N/A'} minutes`)
    console.log(`   Provider payload:`, JSON.stringify(quote.providerPayload, null, 2))
    
    // Test delivery creation
    console.log('\n🚗 Testing delivery creation...')
    const deliveryJobId = randomUUID()
    
    const delivery = await adapter.createDelivery({
      deliveryJobId,
      orderId: testOrderId,
      storeId: store.id,
      dropoffLatitude: customerAddress.latitude,
      dropoffLongitude: customerAddress.longitude,
      dropoffAddressSnapshot: customerAddress
    })
    
    console.log('✅ Delivery created:')
    console.log(`   External ID: ${delivery.providerExternalId}`)
    console.log(`   Tracking URL: ${delivery.trackingUrl}`)
    console.log(`   Status: ${delivery.providerStatus}`)
    console.log(`   Provider payload:`, JSON.stringify(delivery.providerPayload, null, 2))
    
    // Create a DeliveryJob record
    const deliveryJob = await prisma.deliveryJob.create({
      data: {
        id: deliveryJobId,
        orderId: testOrderId,
        storeId: store.id,
        provider: 'DOORDASH_DRIVE',
        status: 'DISPATCHED',
        providerExternalId: delivery.providerExternalId,
        trackingUrl: delivery.trackingUrl,
        providerStatus: delivery.providerStatus,
        providerPayload: delivery.providerPayload as any,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    
    console.log('✅ DeliveryJob created:', deliveryJob.id)
    
    // Verify the DeliveryJob
    const verification = await prisma.deliveryJob.findUnique({
      where: { id: deliveryJobId },
      select: {
        id: true,
        orderId: true,
        storeId: true,
        provider: true,
        status: true,
        providerExternalId: true,
        trackingUrl: true,
        providerStatus: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    console.log('\n📋 Verification results:')
    console.table([{
      delivery_job_id: verification?.id,
      order_id: verification?.orderId,
      store_id: verification?.storeId,
      provider: verification?.provider,
      status: verification?.status,
      provider_external_id: verification?.providerExternalId,
      tracking_url: verification?.trackingUrl,
      provider_status: verification?.providerStatus
    }])
    
    console.log('\n🎉 Delivery quote and creation test completed successfully!')
    
  } catch (error) {
    console.error('❌ Error testing delivery quote:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDeliveryQuote()
