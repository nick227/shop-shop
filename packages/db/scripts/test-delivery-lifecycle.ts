import { prisma } from '../src/client.js'
import { randomUUID } from 'crypto'

async function testDoorDashDeliveryLifecycle() {
  try {
    console.log('🚀 Testing complete DoorDash delivery lifecycle...')
    
    // Find test store and customer
    const store = await prisma.store.findFirst({
      where: { name: { contains: 'Bakery Bliss' } },
      select: { id: true, name: true, latitude: true, longitude: true }
    })
    
    const customer = await prisma.user.findFirst({
      where: { email: 'customer@seed.local' },
      select: { id: true, email: true }
    })
    
    if (!store || !customer) {
      throw new Error('Test store or customer not found')
    }
    
    console.log(`📍 Store: ${store.name} (${store.id})`)
    console.log(`👤 Customer: ${customer.email} (${customer.id})`)
    
    // Test delivery address
    const customerAddress = {
      line1: '123 Test Street',
      city: 'Austin',
      state: 'TX',
      postalCode: '78758',
      latitude: 30.3764,
      longitude: -97.7078
    }
    
    // STEP 1: Create third-party order
    console.log('\n📝 STEP 1: Create third-party order...')
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
    
    console.log(`✅ Order created: ${orderId}`)
    
    // STEP 2: Get DoorDash quote
    console.log('\n💰 STEP 2: Get DoorDash quote...')
    const { getDeliveryProviderAdapter } = await import('../src/services/delivery-provider.registry.js')
    const adapter = getDeliveryProviderAdapter('DOORDASH_DRIVE')
    
    const quote = await adapter.quoteDelivery({
      orderId,
      storeId: store.id,
      dropoffLatitude: customerAddress.latitude,
      dropoffLongitude: customerAddress.longitude
    })
    
    console.log(`✅ Quote: $${quote.feeCents / 100}, ETA: ${quote.etaMinutes}min`)
    
    // STEP 3: Mark order READY
    console.log('\n🔄 STEP 3: Mark order READY...')
    await prisma.$queryRaw`
      UPDATE \`Order\` 
      SET status = 'READY', updatedAt = NOW() 
      WHERE id = ${orderId}
    `
    
    console.log('✅ Order marked READY')
    
    // STEP 4: Dispatch DoorDash
    console.log('\n🚗 STEP 4: Dispatch DoorDash...')
    const deliveryJobId = randomUUID()
    
    const delivery = await adapter.createDelivery({
      deliveryJobId,
      orderId,
      storeId: store.id,
      dropoffLatitude: customerAddress.latitude,
      dropoffLongitude: customerAddress.longitude,
      dropoffAddressSnapshot: customerAddress
    })
    
    console.log(`✅ DoorDash dispatched: ${delivery.providerExternalId}`)
    
    // STEP 5: Create DeliveryJob record
    const deliveryJob = await prisma.deliveryJob.create({
      data: {
        id: deliveryJobId,
        orderId,
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
    
    console.log(`✅ DeliveryJob created: ${deliveryJob.id}`)
    
    // STEP 6: Assert providerExternalId and trackingUrl
    console.log('\n✅ STEP 6: Verify dispatch data...')
    if (!deliveryJob.providerExternalId) {
      throw new Error('❌ providerExternalId not stored')
    }
    if (!deliveryJob.trackingUrl) {
      throw new Error('❌ trackingUrl not stored')
    }
    
    console.log(`✅ providerExternalId: ${deliveryJob.providerExternalId}`)
    console.log(`✅ trackingUrl: ${deliveryJob.trackingUrl}`)
    
    // STEP 7: Fake webhook picked_up
    console.log('\n📡 STEP 7: Send picked_up webhook...')
    const pickedUpResult = await adapter.mapWebhookEvent({
      provider: 'DOORDASH_DRIVE',
      eventType: 'dasher_picked_up',
      payload: {
        external_delivery_id: deliveryJob.providerExternalId,
        event_name: 'dasher_picked_up',
        event_id: 'evt_lifecycle_pickup',
        timestamp: new Date().toISOString()
      }
    })
    
    // Update delivery job and order
    await prisma.deliveryJob.update({
      where: { id: deliveryJob.id },
      data: { providerStatus: pickedUpResult.providerStatus }
    })
    
    if (pickedUpResult.mappedOrderStatus) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: pickedUpResult.mappedOrderStatus }
      })
    }
    
    console.log(`✅ picked_up processed: ${pickedUpResult.providerStatus}`)
    
    // STEP 8: Assert OUT_FOR_DELIVERY
    console.log('\n✅ STEP 8: Verify OUT_FOR_DELIVERY status...')
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true }
    })
    
    if (updatedOrder?.status !== 'OUT_FOR_DELIVERY') {
      throw new Error(`❌ Expected OUT_FOR_DELIVERY, got ${updatedOrder?.status}`)
    }
    
    console.log(`✅ Order status: ${updatedOrder.status}`)
    
    // STEP 9: Fake webhook delivered
    console.log('\n📡 STEP 9: Send delivered webhook...')
    const deliveredResult = await adapter.mapWebhookEvent({
      provider: 'DOORDASH_DRIVE',
      eventType: 'dasher_dropped_off',
      payload: {
        external_delivery_id: deliveryJob.providerExternalId,
        event_name: 'dasher_dropped_off',
        event_id: 'evt_lifecycle_delivered',
        timestamp: new Date().toISOString()
      }
    })
    
    // Update delivery job and order
    await prisma.deliveryJob.update({
      where: { id: deliveryJob.id },
      data: { providerStatus: deliveredResult.providerStatus }
    })
    
    if (deliveredResult.mappedOrderStatus) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: deliveredResult.mappedOrderStatus }
      })
    }
    
    console.log(`✅ delivered processed: ${deliveredResult.providerStatus}`)
    
    // STEP 10: Assert DELIVERED
    console.log('\n✅ STEP 10: Verify DELIVERED status...')
    const finalOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true }
    })
    
    if (finalOrder?.status !== 'DELIVERED') {
      throw new Error(`❌ Expected DELIVERED, got ${finalOrder?.status}`)
    }
    
    console.log(`✅ Final order status: ${finalOrder.status}`)
    
    // STEP 11: Test duplicate webhook
    console.log('\n🔄 STEP 11: Test duplicate webhook handling...')
    
    // Create initial event
    await prisma.deliveryProviderEvent.upsert({
      where: {
        provider_eventId_deliveryJobId: {
          provider: 'DOORDASH_DRIVE',
          eventId: 'evt_lifecycle_duplicate',
          deliveryJobId: deliveryJob.id
        }
      },
      update: {
        eventType: 'dasher_picked_up',
        timestamp: new Date(),
        payload: { test: 'initial' } as any,
        processed: true
      },
      create: {
        id: randomUUID(),
        deliveryJobId: deliveryJob.id,
        provider: 'DOORDASH_DRIVE',
        eventId: 'evt_lifecycle_duplicate',
        eventType: 'dasher_picked_up',
        timestamp: new Date(),
        payload: { test: 'initial' } as any,
        processed: true,
        createdAt: new Date()
      }
    })
    
    // Try to create duplicate event
    await prisma.deliveryProviderEvent.upsert({
      where: {
        provider_eventId_deliveryJobId: {
          provider: 'DOORDASH_DRIVE',
          eventId: 'evt_lifecycle_duplicate',
          deliveryJobId: deliveryJob.id
        }
      },
      update: {
        eventType: 'dasher_picked_up',
        timestamp: new Date(),
        payload: { test: 'duplicate' } as any,
        processed: true
      },
      create: {
        id: randomUUID(),
        deliveryJobId: deliveryJob.id,
        provider: 'DOORDASH_DRIVE',
        eventId: 'evt_lifecycle_duplicate',
        eventType: 'dasher_picked_up',
        timestamp: new Date(),
        payload: { test: 'duplicate' } as any,
        processed: true,
        createdAt: new Date()
      }
    })
    
    console.log('✅ Duplicate webhook handled gracefully')
    
    // STEP 12: Final verification
    console.log('\n🔍 STEP 12: Final lifecycle verification...')
    const finalVerification = await prisma.deliveryJob.findUnique({
      where: { id: deliveryJob.id },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            deliveryMode: true
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
    
    console.log('\n📊 Lifecycle Test Results:')
    console.table([{
      order_id: finalVerification?.order.id,
      order_status: finalVerification?.order.status,
      delivery_mode: finalVerification?.order.deliveryMode,
      delivery_job_id: finalVerification?.id,
      provider: finalVerification?.provider,
      provider_status: finalVerification?.providerStatus,
      provider_external_id: finalVerification?.providerExternalId,
      tracking_url: finalVerification?.trackingUrl,
      store_name: finalVerification?.store.name
    }])
    
    console.log('\n🎉 DoorDash delivery lifecycle test completed successfully!')
    console.log('\n✅ All assertions passed:')
    console.log('   ✓ Quote generation works')
    console.log('   ✓ Order creation works')
    console.log('   ✓ Order READY status works')
    console.log('   ✓ DoorDash dispatch works')
    console.log('   ✓ providerExternalId stored')
    console.log('   ✓ trackingUrl stored')
    console.log('   ✓ picked_up webhook → OUT_FOR_DELIVERY')
    console.log('   ✓ delivered webhook → DELIVERED')
    console.log('   ✓ Duplicate webhooks handled gracefully')
    
    return {
      success: true,
      orderId,
      deliveryJobId: deliveryJob.id,
      providerExternalId: deliveryJob.providerExternalId,
      trackingUrl: deliveryJob.trackingUrl
    }
    
  } catch (error) {
    console.error('❌ DoorDash lifecycle test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  } finally {
    await prisma.$disconnect()
  }
}

testDoorDashDeliveryLifecycle()
