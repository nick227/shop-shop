/**
 * Comprehensive User Seeding Script
 * Creates test accounts for all user types and roles
 */
import { PrismaClient, Role, AffiliateStatus } from '../generated/client/index.js'
import { hash } from 'bcrypt'

const PASSWORD = 'Test123456!'

interface UserSeed {
  email: string
  name: string
  role: Role
  phone?: string
  isCompany?: boolean
  companyName?: string
  affiliateStatus?: AffiliateStatus
  referralCode?: string
  commissionRate?: number
}

const USERS_TO_CREATE: UserSeed[] = [
  // God-level Admin
  {
    email: 'admin@seed.local',
    name: 'Super Admin',
    role: Role.ADMIN,
    phone: '5125550001',
  },
  
  // Regular Admin
  {
    email: 'admin2@seed.local',
    name: 'Platform Admin',
    role: Role.ADMIN,
    phone: '5125550002',
  },
  
  // Staff
  {
    email: 'staff@seed.local',
    name: 'Support Staff',
    role: Role.STAFF,
    phone: '5125550003',
  },
  
  // Regular Customer
  {
    email: 'customer@seed.local',
    name: 'Regular Customer',
    role: Role.USER,
    phone: '5125550004',
  },
  
  // Vendor (Pending)
  {
    email: 'vendor-pending@seed.local',
    name: 'Pending Vendor',
    role: Role.VENDOR_PENDING,
    phone: '5125550005',
    isCompany: true,
    companyName: 'Pending Business LLC',
  },
  
  // Active Vendor
  {
    email: 'vendor@seed.local',
    name: 'Active Vendor',
    role: Role.VENDOR,
    phone: '5125550006',
    isCompany: true,
    companyName: 'Active Business LLC',
  },
  
  // Affiliate (Active)
  {
    email: 'affiliate@seed.local',
    name: 'Marketing Affiliate',
    role: Role.AFFILIATE,
    phone: '5125550007',
    referralCode: 'AFFILIATE2024',
  },
  
  // Affiliate (Pending)
  {
    email: 'affiliate-pending@seed.local',
    name: 'Pending Affiliate',
    role: Role.AFFILIATE,
    phone: '5125550008',
    referralCode: 'AFFILIATE2025',
  },
  
  // Rider
  {
    email: 'rider@seed.local',
    name: 'Delivery Rider',
    role: Role.RIDER,
    phone: '5125550009',
  },
]

export async function seedUsers(prisma: PrismaClient): Promise<void> {
  console.log('👥 Creating comprehensive user accounts...\n')

  const passwordHash = await hash(PASSWORD, 10)
  let createdCount = 0
  let skippedCount = 0
  let affiliateCount = 0

  for (const userSeed of USERS_TO_CREATE) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userSeed.email }
      })

      if (existingUser) {
        console.log(`⏭️  Skipping ${userSeed.email} (already exists)`)
        skippedCount++
        continue
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userSeed.email,
          passwordHash,
          name: userSeed.name,
          role: userSeed.role,
          phone: userSeed.phone,
          isCompany: userSeed.isCompany,
          companyName: userSeed.companyName,
        }
      })

      // Create affiliate record for affiliate users
      if (userSeed.role === Role.AFFILIATE && userSeed.referralCode) {
        await prisma.affiliate.create({
          data: {
            userId: user.id,
            referralCode: userSeed.referralCode,
            status: userSeed.affiliateStatus || AffiliateStatus.PENDING,
            commissionRate: userSeed.commissionRate || 0.10,
          }
        })
        affiliateCount++
      }

      console.log(`✅ Created: ${userSeed.email} (${userSeed.role})`)
      createdCount++
    } catch (error) {
      console.error(`❌ Failed to create ${userSeed.email}:`, error)
    }
  }

  console.log(`\n📊 User seeding complete:`)
  console.log(`   ✅ Created: ${createdCount}`)
  console.log(`   ⏭️  Skipped: ${skippedCount}`)
  console.log(`   🎯 Affiliates: ${affiliateCount}`)
  console.log(`   📝 Total: ${createdCount + skippedCount}`)
  
  console.log(`\n🔑 Test Credentials:`)
  console.log(`   Password for all accounts: ${PASSWORD}`)
  console.log(`\n📧 User Accounts:`)
  USERS_TO_CREATE.forEach(user => {
    const status = user.role === Role.VENDOR_PENDING ? '(Pending)' : 
                   user.affiliateStatus === AffiliateStatus.PENDING ? '(Pending)' : ''
    console.log(`   ${user.email} - ${user.role} ${status}`)
  })
}
