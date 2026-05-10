import { prisma } from '../src/client.js'
import { randomUUID } from 'crypto'

async function testFullDeliveryFlow() {
  try {
    console.log('🚀 Testing full DoorDash delivery flow...')
    
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
        phone: true,
        ownerUserId: true
      }
    })
    
    if (!store) {
      console.error('❌ Store not found')
      return
    }
    
    console.log(`📍 Found store: ${store.name} (${store.id})`)
    
    // Find a test customer
    const customer = await prisma.user.findFirst({
      where: { email: 'customer@seed.local' },
      select: { id: true, email: true, phone: true }
    })
    
    if (!customer) {
      console.error('❌ Customer not found')
      return
    }
    
    console.log(`👤 Found customer: ${customer.email} (${customer.id})`)
    
    // Test customer address (nearby location)
    const customerAddress = {
      line1: '123 Test Street',
      city: 'Austin',
      state: 'TX',
      postalCode: '78758',
      latitude: 30.3764,
      longitude: -97.7078
    }
    
    // Step 1: Create a minimal order using raw SQL
    console.log('\n📝 Step 1: Creating order...')
    const orderId = randomUUID()
    
    await prisma.$queryRaw`
      INSERT INTO \`Order\` (
        id, userId, storeId, status, total, subtotal, tax, tip, 
        paymentStatus, deliveryMode, deliveryLatitude, deliveryLongitude, 
        addressSnapshot, createdAt, updatedAt
      ) VALUES (
        ${orderId},
        ${customer.id},
        ${store.id},
        'PLACED',
        25.99,
        19.99,
        1.00,
        0.00,
        'PAID',
        'THIRD_PARTY_PROVIDER',
        ${customerAddress.latitude},
        ${customerAddress.longitude},
        ${JSON.stringify(customerAddress)},
        NOW(),
        NOW()
      )
    `
    
    console.log('✅ Order created:', orderId)
    
    // Step 2: Get delivery quote
    console.log('\n💰 Step 2: Getting delivery quote...')
    const { getDeliveryProviderAdapter } = await import('../src/services/delivery-provider.registry.js')
    
    const adapter = getDeliveryProviderAdapter('DOORDASH_DRIVE')
    
    const quote = await adapter.quoteDelivery({
      orderId: orderId,
      storeId: store.id,
      dropoffLatitude: customerAddress.latitude,
      dropoffLongitude: customerAddress.longitude
    })
    
    console.log('✅ Quote received:')
    console.log(`   Fee: $${quote.feeCents / 100}`)
    console.log(`   ETA: ${quote.etaMinutes || 'N/A'} minutes`)
    
    // Step 3: Mark order READY
    console.log('\n🔄 Step 3: Marking order READY...')
    await prisma.$queryRaw`
      UPDATE \`Order\` 
      SET status = 'READY', updatedAt = NOW() 
      WHERE id = ${orderId}
    `
    
    console.log('✅ Order marked as READY')
    
    // Step 4: Dispatch DoorDash
    console.log('\n🚗 Step 4: Dispatching DoorDash...')
    const deliveryJobId = randomUUID()
    
    const delivery = await adapter.createDelivery({
      deliveryJobId,
      orderId: orderId,
      storeId: store.id,
      dropoffLatitude: customerAddress.latitude,
      dropoffLongitude: customerAddress.longitude,
      dropoffAddressSnapshot: customerAddress
    })
    
    console.log('✅ Delivery created:')
    console.log(`   External ID: ${delivery.providerExternalId}`)
    console.log(`   Tracking URL: ${delivery.trackingUrl}`)
    console.log(`   Status: ${delivery.providerStatus}`)
    
    // Step 5: Create DeliveryJob record
    console.log('\n📋 Step 5: Creating DeliveryJob record...')
    const deliveryJob = await prisma.deliveryJob.create({
      data: {
        id: deliveryJobId,
        orderId: orderId,
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
    
    // Step 6: Verify everything
    console.log('\n🔍 Step 6: Verification...')
    const verification = await prisma.deliveryJob.findUnique({
      where: { id: deliveryJobId },
      include: {
        order: {
          select: {
            id: true,
            total: true,
            status: true,
            deliveryMode: true,
            paymentStatus: true
          }
        },
        store: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    console.log('\n📊 Full Flow Results:')
    console.table([{
      delivery_job_id: verification?.id,
      order_id: verification?.order.id,
      store_name: verification?.store.name,
      order_status: verification?.order.status,
      payment_status: verification?.order.paymentStatus,
      delivery_mode: verification?.order.deliveryMode,
      provider: verification?.provider,
      delivery_status: verification?.status,
      provider_external_id: verification?.providerExternalId,
      tracking_url: verification?.trackingUrl,
      provider_status: verification?.providerStatus,
      order_total: verification?.order.total
    }])
    
    console.log('\n🎉 Full DoorDash delivery flow test completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('   1. Test webhook endpoint')
    console.log('   2. Build vendor manual dispatch interface')
    console.log('   3. Add delivery status tracking')
    
  } catch (error) {
    console.error('❌ Error in delivery flow test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testFullDeliveryFlow()
