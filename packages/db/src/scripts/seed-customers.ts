import { hash } from 'bcrypt'
import type { PrismaClient } from '../generated/client/index.js'

const PASSWORD = 'Test123456!'

const CUSTOMERS = [
  {
    email: 'maya.chen@seed.local',
    name: 'Maya Chen',
    phone: '5125550101',
    line1: '1200 Metric Blvd',
    city: 'Austin',
    state: 'TX',
    postalCode: '78758',
    lat: 30.384,
    lng: -97.712,
    referred: true,
  },
  {
    email: 'jordan.lee@seed.local',
    name: 'Jordan Lee',
    phone: '5125550102',
    line1: '4500 Duval St',
    city: 'Austin',
    state: 'TX',
    postalCode: '78751',
    lat: 30.311,
    lng: -97.724,
    referred: false,
  },
  {
    email: 'sam.patel@seed.local',
    name: 'Sam Patel',
    phone: '5125550103',
    line1: '1801 E 51st St',
    city: 'Austin',
    state: 'TX',
    postalCode: '78723',
    lat: 30.305,
    lng: -97.698,
    referred: false,
  },
  {
    email: 'riley.nguyen@seed.local',
    name: 'Riley Nguyen',
    phone: '5125550104',
    line1: '900 W 29th St',
    city: 'Austin',
    state: 'TX',
    postalCode: '78705',
    lat: 30.297,
    lng: -97.743,
    referred: false,
  },
  {
    email: 'alex.brooks@seed.local',
    name: 'Alex Brooks',
    phone: '5125550105',
    line1: '5600 Burnet Rd',
    city: 'Austin',
    state: 'TX',
    postalCode: '78756',
    lat: 30.332,
    lng: -97.739,
    referred: false,
  },
] as const

export async function seedCustomers(prisma: PrismaClient): Promise<void> {
  const passwordHash = await hash(PASSWORD, 10)
  const affiliate = await prisma.affiliate.findFirst({
    where: { user: { email: 'affiliate@seed.local' } },
    select: { id: true, referralCode: true },
  })

  for (const [index, customer] of CUSTOMERS.entries()) {
    const referredByAffiliateId = customer.referred ? affiliate?.id : undefined
    const user = await prisma.user.create({
      data: {
        email: customer.email,
        passwordHash,
        name: customer.name,
        role: 'USER',
        phone: customer.phone,
        referredByAffiliateId,
        referredByReferralCode: referredByAffiliateId ? affiliate?.referralCode : undefined,
        referralAttributedAt: referredByAffiliateId ? new Date() : undefined,
      },
    })

    await prisma.address.create({
      data: {
        userId: user.id,
        label: 'Home',
        contactName: customer.name,
        phone: customer.phone,
        line1: customer.line1,
        city: customer.city,
        state: customer.state,
        postalCode: customer.postalCode,
        country: 'US',
        geo: { lat: customer.lat, lng: customer.lng },
        isDefault: true,
        isActive: true,
      },
    })

    await prisma.paymentMethod.create({
      data: {
        userId: user.id,
        provider: 'TEST',
        brand: 'Visa',
        last4: String(1000 + index),
        tokenRef: `pm_seed_customer_${index}`,
        isDefault: true,
      },
    })

    if (referredByAffiliateId && affiliate) {
      await prisma.referralEvent.create({
        data: {
          affiliateId: affiliate.id,
          eventType: 'USER_SIGNUP',
          referredUserId: user.id,
          referralCode: affiliate.referralCode,
        },
      })
    }
  }

  console.log(`Customers created: ${CUSTOMERS.length} (password ${PASSWORD})`)
}
