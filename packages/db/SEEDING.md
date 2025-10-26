# Database Seeding Guide

## Overview

This project includes several seeding scripts to populate the database with test data.

## Available Scripts

### 1. Basic Seed (Default Test Data)

```bash
pnpm --filter @packages/db seed
```

Creates:
- 4 users (1 customer, 3 vendors)
- 3 stores (Pizza, Burger, Sushi) in various US cities
- 20 menu items

### 2. Austin Area Stores (Comprehensive)

```bash
cd packages/db
pnpm tsx src/scripts/seed-austin-stores.ts
```

Creates stores in Austin, TX near ZIP code 78758 with:
- Multiple vendors (auto-generated)
- 10-30+ stores across 8 Austin neighborhoods
- Full menu items for each store type
- Store cover images (from placehold.co)
- Item images (from placehold.co)
- 2-5 river posts per store with images

**Store Types Included:**
- ☕ Coffee shops
- 🍕 Pizza restaurants
- 🍔 Burger joints
- 🍣 Sushi bars
- 🌮 Taco places
- 🍜 Thai restaurants
- 🍖 BBQ joints
- 🥐 Bakeries

**Locations Covered:**
- 78758 (North Central)
- 78757 (North Loop)
- 78759 (Allandale)
- 78752 (Windsor Park)
- 78753 (Georgian Acres)
- 78751 (Hyde Park)
- 78756 (Hancock)
- 78705 (West Campus)

**Features:**
- Realistic coordinates (latitude/longitude)
- Complete address information
- Business hours
- Delivery settings
- Commission rates
- Phone numbers and emails

### 3. Store Locations Seed

```bash
cd packages/db
pnpm tsx src/scripts/seed-store-locations.ts
```

Adds coordinates to existing stores without location data. Uses 20 major US cities.

## Test Credentials

### Default Seed
- **Customer**: `customer@test.com` / `Test123456!`
- **Vendor 1**: `vendor1@test.com` / `Test123456!`
- **Vendor 2**: `vendor2@test.com` / `Test123456!`
- **Vendor 3**: `vendor3@test.com` / `Test123456!`

### Austin Seed
- **Password**: `Test123456!` (for all vendors)
- **Email Format**: `vendor-{store-slug}@test.com`
- **Example**: `vendor-roast-house-north-central@test.com`

## Image Placeholders

All seeded data uses placeholder images from **placehold.co**:

- **Store covers**: `https://placehold.co/1200x400/0066cc/white?text={Store Name}`
- **Menu items**: `https://placehold.co/{size}x{size}/ff6b6b/white?text={Item Name}`
- **River posts**: `https://placehold.co/{width}x{height}/20b2aa/white?text={Store Name} Post`

You can replace these with real images later or use a different placeholder service.

## Full Reset & Reseed

If you want to completely reset and reseed:

```bash
# Reset database (WARNING: Deletes all data!)
pnpm --filter @packages/db reset

# Run migrations
pnpm --filter @packages/db migrate

# Seed with Austin data
cd packages/db
pnpm tsx src/scripts/seed-austin-stores.ts
```

## Custom Seeding

To create your own seeding script:

1. Create a new file in `packages/db/src/scripts/`
2. Import PrismaClient: `import { PrismaClient } from '../generated/client/index.js'`
3. Add your seeding logic
4. Add a script to `package.json`
5. Run with `pnpm --filter @packages/db {your-script-name}`

## Modifying Austin Seed

The Austin seeding script is located at:
```
packages/db/src/scripts/seed-austin-stores.ts
```

You can customize:
- Store types (STORE_TYPES constant)
- Menu items (MENU_ITEMS constant)
- River post templates (POST_TEMPLATES constant)
- Locations (AUSTIN_LOCATIONS constant)
- Image sizes and colors
- Number of stores per location
- Number of items per store
- Number of posts per store

## Tips

1. **Run from project root**: Use `pnpm --filter @packages/db seed:austin`
2. **Check data**: Use `pnpm --filter @packages/db studio` to view Prisma Studio
3. **Idempotent**: Austin seed checks for existing stores by slug (won't duplicate)
4. **Performance**: Seeding 20-30 stores takes ~30-60 seconds
5. **Development only**: Seeding scripts are for development/testing, not production

## Troubleshooting

### Database connection error
```bash
# Check your .env file in packages/db/
DATABASE_URL="mysql://user:password@localhost:3306/shop_shop"
```

### Prisma client not generated
```bash
pnpm --filter @packages/db generate
```

### Migration issues
```bash
pnpm --filter @packages/db migrate
```

### Permission errors
Make sure your database user has CREATE, INSERT, UPDATE, DELETE permissions.

## Next Steps

After seeding:
1. Start the backend server: `pnpm --filter @apps/server dev`
2. Start the frontend: `pnpm --filter @apps/web dev`
3. Navigate to the homepage to see stores
4. Login with test credentials
5. Browse stores, add items to cart, view river posts

---

**Last Updated**: October 23, 2025

