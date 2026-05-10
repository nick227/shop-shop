const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function getTestData() {
  try {
    // Get an active item
    const item = await prisma.item.findFirst({
      where: { isActive: true },
      include: { store: { where: { isPublished: true } } },
      orderBy: { createdAt: 'desc' }
    })

    if (item) {
      console.log(`ITEM_ID=${item.id}`)
      console.log(`ITEM_TITLE=${item.title}`)
      console.log(`STORE_NAME=${item.store?.name || 'Unknown'}`)
    } else {
      console.log('No active items found')
    }

    // Get customer user for login
    const customer = await prisma.user.findFirst({
      where: { role: 'USER' }
    })

    if (customer) {
      console.log(`CUSTOMER_EMAIL=${customer.email}`)
      console.log('CUSTOMER_PASSWORD=Test123456!')
    } else {
      console.log('No customer user found')
    }

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

getTestData()
