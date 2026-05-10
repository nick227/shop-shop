import { prisma } from '../src/client.js'

async function testDoorDashWebhook() {
  try {
    console.log('🔔 Testing DoorDash webhook processing...')
    
    // Find the most recent delivery job
    const deliveryJob = await prisma.deliveryJob.findFirst({
      where: { provider: 'DOORDASH_DRIVE' },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            status: true
          }
        }
      }
    })
    
    if (!deliveryJob) {
      console.error('❌ No DoorDash delivery job found')
      return
    }
    
    console.log(`📦 Found delivery job: ${deliveryJob.id}`)
    console.log(`📦 External ID: ${deliveryJob.providerExternalId}`)
    console.log(`📦 Current status: ${deliveryJob.providerStatus}`)
    
    // Test webhook payloads for different events
    const webhookEvents = [
      {
        eventName: 'dasher_enroute_pickup',
        payload: {
          external_delivery_id: deliveryJob.providerExternalId,
          event_name: 'dasher_enroute_pickup',
          event_id: 'evt_12345',
          timestamp: new Date().toISOString(),
          dasher: {
            name: 'John Doe',
            phone: '555-0123',
            vehicle: 'Toyota Camry',
            location: {
              lat: 30.3993,
              lng: -97.7560,
              updated_at: new Date().toISOString()
            }
          }
        }
      },
      {
        eventName: 'dasher_picked_up',
        payload: {
          external_delivery_id: deliveryJob.providerExternalId,
          event_name: 'dasher_picked_up',
          event_id: 'evt_12346',
          timestamp: new Date().toISOString(),
          dasher: {
            name: 'John Doe',
            phone: '555-0123',
            vehicle: 'Toyota Camry',
            location: {
              lat: 30.3993,
              lng: -97.7560,
              updated_at: new Date().toISOString()
            }
          }
        }
      },
      {
        eventName: 'dasher_dropped_off',
        payload: {
          external_delivery_id: deliveryJob.providerExternalId,
          event_name: 'dasher_dropped_off',
          event_id: 'evt_12347',
          timestamp: new Date().toISOString(),
          dasher: {
            name: 'John Doe',
            phone: '555-0123',
            vehicle: 'Toyota Camry',
            location: {
              lat: 30.3764,
              lng: -97.7078,
              updated_at: new Date().toISOString()
            }
          }
        }
      }
    ]
    
    // Test each webhook event
    for (const event of webhookEvents) {
      console.log(`\n📡 Testing webhook event: ${event.eventName}`)
      
      // Simulate webhook processing using the adapter
      const { getDeliveryProviderAdapter } = await import('../src/services/delivery-provider.registry.js')
      const adapter = getDeliveryProviderAdapter('DOORDASH_DRIVE')
      
      const result = await adapter.mapWebhookEvent({
        provider: 'DOORDASH_DRIVE',
        eventType: event.eventName,
        payload: event.payload
      })
      
      console.log(`✅ Event mapped:`)
      console.log(`   Provider status: ${result.providerStatus}`)
      console.log(`   Mapped order status: ${result.mappedOrderStatus || 'N/A'}`)
      
      // Update the delivery job status
      await prisma.deliveryJob.update({
        where: { id: deliveryJob.id },
        data: {
          providerStatus: result.providerStatus,
          providerPayload: event.payload as any,
          updatedAt: new Date()
        }
      })
      
      // Update order status if mapped
      if (result.mappedOrderStatus) {
        await prisma.order.update({
          where: { id: deliveryJob.orderId },
          data: {
            status: result.mappedOrderStatus,
            updatedAt: new Date()
          }
        })
      }
      
      // Create delivery provider event record using upsert to handle duplicates gracefully
      await prisma.deliveryProviderEvent.upsert({
        where: {
          provider_eventId_deliveryJobId: {
            provider: 'DOORDASH_DRIVE',
            eventId: event.payload.event_id,
            deliveryJobId: deliveryJob.id
          }
        },
        update: {
          eventType: event.eventName,
          timestamp: new Date(event.payload.timestamp),
          payload: event.payload as any,
          processed: true
        },
        create: {
          id: `evt_${Date.now()}_${Math.random()}`,
          deliveryJobId: deliveryJob.id,
          provider: 'DOORDASH_DRIVE',
          eventId: event.payload.event_id,
          eventType: event.eventName,
          timestamp: new Date(event.payload.timestamp),
          payload: event.payload as any,
          processed: true,
          createdAt: new Date()
        }
      })
      
      console.log(`✅ Status updated in database`)
    }
    
    // Final verification
    console.log('\n🔍 Final verification...')
    const finalDeliveryJob = await prisma.deliveryJob.findUnique({
      where: { id: deliveryJob.id },
      include: {
        order: {
          select: {
            id: true,
            status: true
          }
        },
        DeliveryProviderEvents: {
          orderBy: { timestamp: 'desc' },
          take: 3
        }
      }
    })
    
    console.log('\n📊 Final Results:')
    console.table([{
      delivery_job_id: finalDeliveryJob?.id,
      provider_status: finalDeliveryJob?.providerStatus,
      order_status: finalDeliveryJob?.order.status,
      events_processed: finalDeliveryJob?.DeliveryProviderEvents.length
    }])
    
    console.log('\n📋 Recent Events:')
    finalDeliveryJob?.DeliveryProviderEvents.forEach((event: any) => {
      console.log(`   ${event.timestamp.toISOString()}: ${event.eventType} (${event.eventId})`)
    })
    
    console.log('\n🎉 DoorDash webhook test completed successfully!')
    
  } catch (error) {
    console.error('❌ Error testing webhook:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDoorDashWebhook()
