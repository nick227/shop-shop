import { type Prisma, type PrismaClient } from '../src/generated/client/index.js'
import { hash } from 'bcrypt'
import { seedCanonicalTags } from '../src/scripts/seed-tags.js'

const now = new Date()
const validFrom = new Date(now)
validFrom.setDate(validFrom.getDate() - 7)
const validUntil = new Date(now)
validUntil.setDate(validUntil.getDate() + 90)

const demoPolygon = {
  type: 'Feature',
  properties: { name: 'Downtown' },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [-73.9851, 40.7589],
        [-73.9751, 40.7589],
        [-73.9751, 40.7689],
        [-73.9851, 40.7689],
        [-73.9851, 40.7589],
      ],
    ],
  },
} satisfies Prisma.InputJsonValue

export async function seedFullDemo(prisma: PrismaClient): Promise<void> {
  await seedCanonicalTags(prisma)

  await prisma.geocodingCache.create({
    data: {
      queryType: 'zip',
      queryValue: 'SEED-10001',
      latitude: 40.7589,
      longitude: -73.9851,
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'US',
      formattedAddress: '10001, New York, NY, US',
      confidence: 'high',
      source: 'manual',
    },
  })

  await prisma.paymentWebhook.create({
    data: {
      provider: 'stripe',
      eventId: 'evt_seed_demo_001',
      type: 'payment_intent.succeeded',
      payload: { id: 'evt_seed_demo_001', object: 'event', data: { object: { id: 'pi_seed' } } },
      processed: true,
    },
  })

  const passwordHash = await hash('Test123456!', 10)

  const affiliateUser = await prisma.user.create({
    data: {
      email: 'affiliate-demo@seed.local',
      name: 'Seed Affiliate',
      phone: '555-2020',
      role: 'AFFILIATE',
      passwordHash,
    },
  })

  const affiliate = await prisma.affiliate.create({
    data: {
      userId: affiliateUser.id,
      status: 'ACTIVE',
      referralCode: 'SEEDPARTNER',
      commissionRate: 0.05,
      paypalEmail: 'affiliate-payouts@seed.local',
      bankAccountJson: { routingLast4: '1100', accountLast4: '4421' },
      taxId: '12-3456789',
      bio: 'Demo affiliate for seed data.',
      website: 'https://seed.local/partner',
    },
  })

  const vendor = await prisma.user.create({
    data: {
      email: 'vendor-demo@seed.local',
      name: 'Jamie Vendor',
      phone: '555-1010',
      role: 'VENDOR',
      isCompany: true,
      companyName: 'Seed Foods LLC',
      passwordHash,
      vendorVerification: {
        create: {
          businessName: 'Seed Foods LLC',
          businessType: 'LLC',
          taxId: '98-7654321',
          documentsJson: [{ kind: 'EIN', ref: 'doc_seed_1' }],
          status: 'APPROVED',
          submittedAt: validFrom,
          reviewedAt: validFrom,
          approvedAt: validFrom,
          stripeAccountId: 'acct_seed_vendor',
          reviewNotes: 'Approved for seed.',
        },
      },
    },
  })

  const customer =
    (await prisma.user.findUnique({ where: { email: 'customer@seed.local' } })) ??
    (await prisma.user.create({
      data: {
        email: 'customer@seed.local',
        name: 'Casey Customer',
        phone: '555-3030',
        role: 'USER',
        passwordHash,
      },
    }))

  const address = await prisma.address.create({
    data: {
      userId: customer.id,
      label: 'Home',
      contactName: 'Casey Customer',
      phone: '555-3030',
      line1: '400 Seed Street',
      line2: 'Apt 2',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
      instructions: 'Ring bell twice.',
      geo: { lat: 40.7614, lng: -73.9776 },
      isDefault: true,
      isActive: true,
    },
  })

  await prisma.paymentMethod.create({
    data: {
      userId: customer.id,
      provider: 'TEST',
      brand: 'Visa',
      last4: '4242',
      tokenRef: 'pm_seed_test_4242',
      isDefault: true,
    },
  })

  const storeNorth = await prisma.store.create({
    data: {
      ownerUserId: vendor.id,
      name: 'Seed Bistro North',
      slug: 'seed-bistro-north',
      description: 'Primary demo store with full JSON and geo fields.',
      companyName: 'Seed Foods LLC',
      taxId: '98-7654321',
      phone: '555-4040',
      email: 'north@seed.local',
      website: 'https://seed.local/north',
      isPublished: true,
      deliveryEnabled: true,
      pickupEnabled: true,
      prepTimeMin: 22,
      feesJson: {
        deliveryFee: 3.25,
        serviceFeePercent: 8,
        smallOrderThreshold: 18,
      },
      hoursJson: {
        monday: { open: '11:00', close: '21:30' },
        sunday: { open: '12:00', close: '20:00' },
      },
      deliveryDistance: 4.5,
      deliveryCharge: 3.25,
      latitude: 40.7589,
      longitude: -73.9851,
      addressStreet: '100 Demo Plaza',
      addressCity: 'New York',
      addressState: 'NY',
      addressZip: '10001',
      addressCountry: 'US',
      geocodedAt: now,
      geocodeSource: 'manual',
      referredByAffiliateId: affiliate.id,
      stripeAccountId: 'acct_seed_north',
      stripeOnboarded: true,
      commissionRate: 9.25,
    },
  })

  const storeSouth = await prisma.store.create({
    data: {
      ownerUserId: vendor.id,
      name: 'Seed Bistro South',
      slug: 'seed-bistro-south',
      description: 'Second demo store for multi-store flows.',
      isPublished: true,
      deliveryEnabled: true,
      pickupEnabled: false,
      prepTimeMin: 18,
      phone: '555-6061',
      email: 'south@seed.local',
      latitude: 34.0522,
      longitude: -118.2437,
      addressStreet: '200 Example Blvd',
      addressCity: 'Los Angeles',
      addressState: 'CA',
      addressZip: '90001',
      addressCountry: 'US',
      geocodedAt: now,
      geocodeSource: 'api',
      feesJson: { deliveryFee: 2.5 },
      hoursJson: { default: { open: '10:00', close: '22:00' } },
      stripeOnboarded: false,
    },
  })

  await prisma.mediaAsset.create({
    data: {
      storeId: storeSouth.id,
      kind: 'IMAGE',
      url: 'https://placehold.co/1200x400/2d3436/ffffff?text=Seed+Bistro+South',
      altText: 'Seed Bistro South banner',
      sortIndex: 0,
    },
  })

  const itemSouth = await prisma.item.create({
    data: {
      storeId: storeSouth.id,
      title: 'LA Garden Bowl',
      description: 'Seasonal greens, citrus, seeds.',
      price: 13.25,
      isActive: true,
      isSoldOut: false,
      sortIndex: 1,
      optionsJson: { bowl: 'garden' },
      stockQty: 25,
      spicyLevel: 0,
      tags: {
        create: ['salad', 'vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'lunch', 'dinner'].map((slug) => ({
          tag: { connect: { slug } },
        })),
      },
    },
  })

  await prisma.mediaAsset.create({
    data: {
      itemId: itemSouth.id,
      kind: 'IMAGE',
      url: 'https://placehold.co/800x600/636e72/ffffff?text=Garden+Bowl',
      altText: 'Garden bowl',
      sortIndex: 0,
    },
  })

  await prisma.deliveryZone.create({
    data: {
      storeId: storeNorth.id,
      name: 'Core downtown',
      polygonJson: demoPolygon,
      baseFee: 2.5,
      minOrder: 15,
      isActive: true,
      priority: 10,
    },
  })

  await prisma.mediaAsset.create({
    data: {
      storeId: storeNorth.id,
      kind: 'IMAGE',
      url: 'https://placehold.co/1200x400/1a1a2e/ffffff?text=Seed+Bistro+Banner',
      altText: 'Seed Bistro North storefront banner',
      metadata: { w: 1200, h: 400, seed: true },
      sortIndex: 0,
    },
  })

  const itemOne = await prisma.item.create({
    data: {
      storeId: storeNorth.id,
      title: 'Market Grain Bowl',
      description: 'Quinoa, roasted vegetables, tahini.',
      price: 14.5,
      isActive: true,
      isSoldOut: false,
      sortIndex: 1,
      optionsJson: {
        sizes: [{ id: 'sm', label: 'Small', delta: 0 }],
        extras: [{ id: 'avo', label: 'Avocado', price: 2 }],
      },
      stockQty: 40,
      allergensJson: ['sesame', 'tree nuts'],
      spicyLevel: 1,
      tags: {
        create: ['entree', 'vegan', 'vegetarian', 'dairy-free', 'contains-gluten', 'contains-nuts', 'lunch', 'dinner'].map((slug) => ({
          tag: { connect: { slug } },
        })),
      },
    },
  })

  const itemTwo = await prisma.item.create({
    data: {
      storeId: storeNorth.id,
      title: 'Smoked Salmon Plate',
      description: 'House-cured salmon, pickles, crème garnish.',
      price: 22,
      isActive: true,
      sortIndex: 2,
      optionsJson: { protein: 'salmon', plateStyle: 'classic' },
      stockQty: 18,
      allergensJson: ['fish', 'dairy'],
      spicyLevel: 0,
      tags: {
        create: ['entree', 'gluten-free', 'contains-dairy', 'lunch', 'dinner'].map((slug) => ({
          tag: { connect: { slug } },
        })),
      },
    },
  })

  await prisma.mediaAsset.createMany({
    data: [
      {
        itemId: itemOne.id,
        kind: 'IMAGE',
        url: 'https://placehold.co/800x600/16213e/ffffff?text=Grain+Bowl',
        altText: 'Grain bowl',
        sortIndex: 0,
      },
      {
        itemId: itemTwo.id,
        kind: 'IMAGE',
        url: 'https://placehold.co/800x600/0f3460/ffffff?text=Salmon',
        altText: 'Salmon plate',
        sortIndex: 0,
      },
    ],
  })

const bundle = await prisma.bundle.create({
  data: {
    storeId: storeNorth.id,
    name: "Seed Duo",
    description: "Bowl + salmon for sharing.",
    isActive: true,
    sortIndex: 0,
    media: {
      create: [
        {
          kind: "IMAGE",
          url: "https://placehold.co/600x400/e94560/ffffff?text=Bundle",
          altText: "Seed Duo bundle image",
          sortIndex: 0,
        },
      ],
    },
  },
})

  await prisma.bundleItem.createMany({
    data: [
      { bundleId: bundle.id, itemId: itemOne.id, quantity: 1, sortIndex: 0 },
      { bundleId: bundle.id, itemId: itemTwo.id, quantity: 1, sortIndex: 1 },
    ],
  })

  await prisma.bundlePricing.create({
    data: {
      bundleId: bundle.id,
      pricingType: 'FIXED_PRICE',
      fixedPrice: 32,
      showSavings: true,
      savingsLabel: 'Save vs à la carte',
      minSavings: 4.5,
    },
  })

  const promotion = await prisma.promotion.create({
    data: {
      storeId: storeNorth.id,
      code: 'SEED10',
      name: 'Seed launch',
      description: '10% off demo orders.',
      type: 'PERCENTAGE',
      status: 'ACTIVE',
      value: 10,
      minOrderValue: 20,
      maxDiscount: 8,
      usageLimit: 500,
      usageLimitPerUser: 3,
      allowStacking: false,
      eligibleUserIds: [customer.id],
      excludedUserIds: [],
      validFrom,
      validUntil,
      isGlobal: false,
      createdById: vendor.id,
    },
  })

  await prisma.teamMember.createMany({
    data: [
      {
        storeId: storeNorth.id,
        userId: vendor.id,
        permissionsJson: ['FULL_ACCESS'],
        isActive: true,
      },
      {
        storeId: storeSouth.id,
        userId: vendor.id,
        permissionsJson: ['VIEW_ORDERS', 'MANAGE_ITEMS'],
        isActive: true,
      },
    ],
  })

  await prisma.invitation.create({
    data: {
      storeId: storeSouth.id,
      senderUserId: vendor.id,
      recipientEmail: 'staff.pending@seed.local',
      token: 'seed-invite-token-south-001',
      permissionsJson: ['VIEW_ORDERS'],
      status: 'PENDING',
      message: 'Join Seed Bistro South.',
      expiresAt: validUntil,
    },
  })

  await prisma.favoriteStore.createMany({
    data: [
      { userId: customer.id, storeId: storeNorth.id },
      { userId: customer.id, storeId: storeSouth.id },
    ],
  })

  await prisma.favoriteItem.create({
    data: { userId: customer.id, itemId: itemOne.id },
  })

  const postNorth = await prisma.post.create({
    data: {
      storeId: storeNorth.id,
      content: 'Opening weekend — try the grain bowl + salmon bundle.',
      mediaUrls: [
        {
          type: 'image',
          url: 'https://placehold.co/1080x1080/533483/ffffff?text=North+Post',
          thumbnail: 'https://placehold.co/300x300/533483/ffffff?text=Thumb',
          title: 'Weekend special',
          provider: 'placehold',
          width: 1080,
          height: 1080,
        },
      ],
      likesCount: 1,
      commentsCount: 1,
      sharesCount: 0,
      priority: 2,
      layout: 'default_layout',
      source: 'MANUAL',
      linkedItemId: itemOne.id,
      publishAt: null,
    },
  })

  const postSouth = await prisma.post.create({
    data: {
      storeId: storeSouth.id,
      content: 'LA location is live for pickup tests.',
      mediaUrls: [],
      likesCount: 0,
      commentsCount: 0,
      source: 'AUTO_STORE',
      automationKey: `welcome:${storeSouth.id}`,
      layout: 'default_layout',
      priority: 0,
    },
  })

  await prisma.postLike.create({
    data: { postId: postNorth.id, userId: customer.id },
  })

  await prisma.comment.create({
    data: {
      postId: postNorth.id,
      userId: vendor.id,
      content: 'Thanks for supporting local — bundle saves ~$4.50!',
    },
  })

  const cart = await prisma.cart.create({
    data: {
      userId: customer.id,
      storeId: storeNorth.id,
      status: 'ACTIVE',
      note: 'Extra napkins please.',
    },
  })

  await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      itemId: itemOne.id,
      titleSnapshot: 'Market Grain Bowl',
      unitPrice: 14.5,
      quantity: 1,
      optionsJson: { size: 'sm' },
      notes: 'No sesame on side.',
    },
  })

  const subtotal = 36.5
  const fees = 3.25
  const tax = 2.92
  const tipAmt = 5
  const total = subtotal + fees + tax + tipAmt
  const serviceFeePercent = 8
  const serviceFeeAmount = Number(((subtotal * serviceFeePercent) / 100).toFixed(2))
  const netToVendor = Number((subtotal - serviceFeeAmount).toFixed(2))

  const order = await prisma.order.create({
    data: {
      userId: customer.id,
      storeId: storeNorth.id,
      cartId: cart.id,
      status: 'DELIVERED',
      deliveryType: 'DELIVERY',
      paymentStatus: 'PAID',
      subtotal,
      fees,
      tax,
      tip: tipAmt,
      total,
      serviceFeePercent,
      serviceFeeAmount,
      netToVendor,
      stripePaymentIntentId: 'pi_seed_demo_001',
      stripeChargeId: 'ch_seed_demo_001',
      stripeTransferId: 'tr_seed_demo_001',
      stripeApplicationFeeId: 'fee_seed_demo_001',
      addressId: address.id,
      addressSnapshot: {
        line1: address.line1,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
      },
      deliveryLatitude: 40.7614,
      deliveryLongitude: -73.9776,
      deliveryDistanceMiles: 1.2,
      estimatedDeliveryAt: new Date(now.getTime() + 45 * 60 * 1000),
    },
  })

  await prisma.cart.update({
    where: { id: cart.id },
    data: { status: 'SUBMITTED' },
  })

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order.id,
        itemId: itemOne.id,
        titleSnapshot: 'Market Grain Bowl',
        unitPrice: 14.5,
        quantity: 1,
        optionsJson: { size: 'sm' },
      },
      {
        orderId: order.id,
        itemId: itemTwo.id,
        titleSnapshot: 'Smoked Salmon Plate',
        unitPrice: 22,
        quantity: 1,
      },
    ],
  })

  await prisma.orderEvent.createMany({
    data: [
      { orderId: order.id, status: 'PENDING_PAYMENT', note: 'Checkout started' },
      { orderId: order.id, status: 'PLACED', note: 'Paid' },
      { orderId: order.id, status: 'DELIVERED', note: 'Left at door' },
    ],
  })

  await prisma.tip.create({
    data: {
      orderId: order.id,
      amount: tipAmt,
      status: 'PAID',
      stripePaymentIntentId: 'pi_seed_tip_001',
      stripeChargeId: 'ch_seed_tip_001',
    },
  })

  await prisma.promotionRedemption.create({
    data: {
      promotionId: promotion.id,
      userId: customer.id,
      orderId: order.id,
      discountAmount: 3.65,
    },
  })

  await prisma.commission.create({
    data: {
      affiliateId: affiliate.id,
      orderId: order.id,
      storeId: storeNorth.id,
      amount: 1.25,
      rate: 0.05,
      serviceFeeBase: serviceFeeAmount,
      status: 'PENDING',
    },
  })

  await prisma.affiliatePayout.create({
    data: {
      affiliateId: affiliate.id,
      amount: 25,
      method: 'PAYPAL',
      status: 'PENDING',
      periodStart: validFrom,
      periodEnd: validUntil,
    },
  })
}
